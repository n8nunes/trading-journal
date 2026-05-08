"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage, ADMIN_UID } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp 
} from "firebase/firestore";

interface TradingRule {
  id: string;
  text: string;
  subRules: string[];
}
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface TradeEntry {
  pair: string;
  pl: string;
  confluences: string;
  file: File | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(true);
  const [dailyBias, setDailyBias] = useState("");
  const [news, setNews] = useState("");
  const [trades, setTrades] = useState<TradeEntry[]>([
    { pair: "EURUSD", pl: "", confluences: "", file: null }
  ]);
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([]);

  // Autofill News
  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news");
        if (res.ok) {
          const result = await res.json();
          if (result.data && result.data !== "No Red Folder News") {
            setNews(result.data);
          } else if (result.data === "No Red Folder News") {
            setNews("None today");
          }
        }
      } catch (err) {
        console.error("Failed to fetch news:", err);
      }
    }
    fetchNews();
  }, []);

  // Auth Guard + Fetch Rules
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user || user.uid !== ADMIN_UID) {
        router.push("/login");
      } else {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().tradingRules?.length > 0) {
            setTradingRules(userDoc.data().tradingRules);
          }
        } catch (err) {
          console.error("Failed to fetch trading rules:", err);
        }
      }
    });
    return () => unsub();
  }, [router]);

  const addTradeSlot = () => {
    setTrades([...trades, { pair: "EURUSD", pl: "", confluences: "", file: null }]);
  };

  const handleTradeChange = (index: number, field: keyof TradeEntry, value: any) => {
    const newTrades = [...trades];
    (newTrades[index] as any)[field] = value;
    setTrades(newTrades);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const processedTrades = await Promise.all(
        trades.map(async (trade) => {
          let url = "";
          if (trade.file) {
            const sRef = ref(storage, `charts/${Date.now()}-${trade.file.name}`);
            const snap = await uploadBytes(sRef, trade.file);
            url = await getDownloadURL(snap.ref);
          }
          return {
            pair: trade.pair.toUpperCase(),
            pl: Number(trade.pl),
            confluences: trade.confluences,
            chart_url: url,
          };
        })
      );

      // IMPORTANT: We still attach the userId here so the Firestore Security Rules work
      const docRef = await addDoc(collection(db, "daily_logs"), {
        userId: auth.currentUser?.uid,
        date: serverTimestamp(),
        daily_bias: dailyBias,
        news_events: news,
        trades: processedTrades,
        summary_card_url: "", 
      });

      const dateStr = new Date().toLocaleDateString('en-GB');
      const genResponse = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_bias: dailyBias,
          news_events: news,
          trades: processedTrades,
          date_str: dateStr
        }),
      });

      if (!genResponse.ok) throw new Error('OG_GENERATION_FAILED');

      const imageBlob = await genResponse.blob();
      const summaryRef = ref(storage, `summaries/${docRef.id}.png`);
      const imageSnap = await uploadBytes(summaryRef, imageBlob, { contentType: 'image/png' });
      const summaryUrl = await getDownloadURL(imageSnap.ref);

      await updateDoc(doc(db, "daily_logs", docRef.id), {
        summary_card_url: summaryUrl,
      });

      await fetch('/api/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_bias: dailyBias,
          trades: processedTrades,
          summary_card_url: summaryUrl
        }),
      });

      alert("TERMINAL_SYNC_COMPLETE: Journal entry locked and broadcasted.");
      router.push("/");
    } catch (err) {
      console.error("Critical Terminal Error:", err);
      alert("SYNC_FAILED: System logic halted. Check console logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige-retro text-brown-dark p-6 md:p-12 font-mono">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        
        {/* Terminal Header with Settings Link */}
        <header className="border-b-4 border-brown-dark pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter">nfx // Session_Input_Terminal</h1>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setIsRulesOpen(true)} 
              className="w-fit text-[10px] font-black bg-brown-dark text-beige-retro px-3 py-1 uppercase border-2 border-brown-dark hover:bg-beige-retro hover:text-brown-dark cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
            >
              VIEW_RULES
            </button>
            <button 
              type="button" 
              onClick={() => router.push("/")} 
              className="w-fit text-[10px] font-black bg-beige-retro text-brown-dark px-3 py-1 uppercase border-2 border-brown-dark hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
            >
              ABORT_TO_FEED
            </button>
          </div>
        </header>

        {/* Global Context Inputs */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brown-medium">// Daily_Bias</label>
            <input 
              required
              className="w-full bg-beige-muted border-2 border-brown-dark p-3 outline-none focus:bg-white placeholder:opacity-30 transition-all duration-200 focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] outline-none"
              placeholder="e.g., BULLISH - HTF Liquidity Sweep"
              onChange={(e) => setDailyBias(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brown-medium">// Red_Folder_News</label>
            <input 
              className="transition-all duration-200 focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] outline-none w-full bg-beige-muted border-2 border-brown-dark p-3 outline-none focus:bg-white placeholder:opacity-30"
              placeholder="e.g., 10:30PM USD CPI (High Vol)"
              value={news}
              onChange={(e) => setNews(e.target.value)}
            />
          </div>
        </div>

        {/* Trades Execution List */}
        <div className="space-y-6">
          <h2 className="text-sm font-black bg-brown-dark text-beige-retro px-3 py-1 inline-block uppercase tracking-widest">
            Executed_Positions
          </h2>
          
          {trades.map((trade, index) => (
            <div 
              key={index} 
              className="p-6 border-2 border-brown-dark bg-beige-muted space-y-4 shadow-[6px_6px_0px_0px_rgba(74,55,33,1)]"
            >
              <div className="flex justify-between items-center border-b border-brown-light/30 pb-2">
                <span className="font-black text-[10px] uppercase text-brown-medium">ENTRY_LOG_{index + 1}</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <input 
                    required
                    placeholder="Pair (e.g. EURUSD)"
                    className="transition-all duration-200 focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] outline-none w-full bg-beige-retro border border-brown-light p-2 text-sm outline-none uppercase font-bold"
                    value={trade.pair}
                    onChange={(e) => handleTradeChange(index, "pair", e.target.value)}
                  />
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    placeholder="P/L Amount (%)"
                    className="transition-all duration-200 focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] outline-none w-full bg-beige-retro border border-brown-light p-2 text-sm outline-none"
                    onChange={(e) => handleTradeChange(index, "pl", e.target.value)}
                  />
                  <div className="border border-brown-light p-3 bg-beige-retro">
                    <label className="block text-[9px] uppercase font-black text-brown-medium mb-2">Attach_Chart_Snapshot</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="transition-all duration-200 focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] outline-none text-[10px] w-full border border-brown-light file:bg-brown-dark file:text-beige-retro file:border-0 file:px-2 file:py-1 file:mr-4 file:uppercase file:font-black cursor-pointer"
                      onChange={(e) => handleTradeChange(index, "file", e.target.files?.[0])}
                    />
                  </div>
                </div>
                <textarea 
                  required
                  placeholder="Confluences (iFVG, SMT Divergence, MSS...)"
                  className="transition-all duration-200 focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] outline-none w-full bg-beige-retro border border-brown-light p-3 text-sm outline-none h-full min-h-[120px] resize-none"
                  onChange={(e) => handleTradeChange(index, "confluences", e.target.value)}
                />
              </div>
            </div>
          ))}

          <button 
            type="button" 
            onClick={addTradeSlot}
            className="w-full border-2 border-dashed border-brown-medium p-4 text-brown-medium hover:bg-brown-dark hover:text-beige-retro transition-all uppercase font-black text-xs cursor-pointer tracking-widest hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
          >
            + Initialize_New_Execution_Slot
          </button>
        </div>

        {/* Final Commit Button */}
        <div className="relative group pt-12 pb-24">
          <div className="absolute inset-0 bg-brown-medium translate-x-3 translate-y-3 mt-12" />
          <button
            type="submit"
            disabled={loading}
            className={`
              relative cursor-pointer w-full p-6 border-4 border-brown-dark font-black text-xl uppercase hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none
              ${loading 
                ? "bg-brown-medium text-beige-retro translate-x-2 translate-y-2 cursor-wait" 
                : "bg-brown-dark text-beige-retro hover:-translate-x-1 hover:-translate-y-1 active:translate-x-2 active:translate-y-2 shadow-none"}
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-4">
                <span className="animate-spin text-2xl">/</span>
                Executing_Sync_Protocol...
              </span>
            ) : (
              "COMMIT_DAILY_LOG"
            )}
          </button>
        </div>
      </form>
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} rules={tradingRules} />
    </div>
  );
}

// ==========================================
// Rules Modal Component
// ==========================================
function RulesModal({ isOpen, onClose, rules }: { isOpen: boolean; onClose: () => void; rules: TradingRule[] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brown-dark/80 backdrop-blur-lg p-4 animate-in fade-in duration-200 font-mono">
      <div className="bg-beige-retro border-4 border-brown-dark shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] w-full max-w-lg p-6 relative flex flex-col max-h-[90vh]">
        <h2 className="text-xl font-black text-brown-dark mb-4 border-b-4 border-brown-dark pb-2 uppercase tracking-tighter shrink-0">
          // Trading_Rules
        </h2>

        <div className="space-y-4 overflow-y-auto flex-grow [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {rules.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-brown-light text-center">
              <p className="text-sm font-black text-brown-medium uppercase tracking-widest mb-2">NO_RULES_DEFINED</p>
              <p className="text-xs text-brown-medium">Go to Settings → Trading Rules to define your rules.</p>
            </div>
          ) : (
            rules.map((rule, index) => (
              <div key={rule.id} className="p-4 bg-beige-muted border-2 border-brown-dark">
                <span className="text-[10px] font-black uppercase text-brown-medium block mb-1">
                  RULE_{String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm font-bold text-brown-dark leading-relaxed">
                  {rule.text}
                </p>
                {rule.subRules?.length > 0 && (
                  <div className="space-y-2 pl-4 border-l-2 border-brown-medium mt-3">
                    {rule.subRules.map((sub, subIdx) => (
                      <div key={subIdx} className="flex gap-2">
                        <span className="text-xs font-black text-brown-medium shrink-0">
                          {String.fromCharCode(65 + subIdx)}.
                        </span>
                        <p className="text-xs font-bold text-brown-dark">{sub}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-2 shrink-0">
          <button
            onClick={onClose}
            className="w-full text-center text-sm font-black bg-brown-dark text-beige-retro px-4 py-3 uppercase border-2 border-brown-dark hover:bg-beige-retro hover:text-brown-dark cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
          >
            ACKNOWLEDGE_&_PROCEED
          </button>
        </div>
      </div>
    </div>
  );
}