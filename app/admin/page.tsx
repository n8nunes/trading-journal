"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage, ADMIN_UID } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
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
  const [dailyBias, setDailyBias] = useState("");
  const [news, setNews] = useState("");
  const [trades, setTrades] = useState<TradeEntry[]>([
    { pair: "EURUSD", pl: "", confluences: "", file: null }
  ]);

  // Auth Guard: Ensure only you (the Admin) can access this terminal
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user || user.uid !== ADMIN_UID) {
        router.push("/login");
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
      // 1. UPLOAD PIPELINE: Process individual trade screenshots
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

      // 2. ARCHIVE PIPELINE: Save initial log to Firestore
      const docRef = await addDoc(collection(db, "daily_logs"), {
        date: serverTimestamp(),
        daily_bias: dailyBias,
        news_events: news,
        trades: processedTrades,
        summary_card_url: "", // Placeholder for the generated card
      });

      // 3. GENERATION PIPELINE: Trigger @vercel/og to create the Session Card
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

      // 4. STORAGE PIPELINE: Upload the generated PNG back to Firebase
      const imageBlob = await genResponse.blob();
      const summaryRef = ref(storage, `summaries/${docRef.id}.png`);
      const imageSnap = await uploadBytes(summaryRef, imageBlob, { contentType: 'image/png' });
      const summaryUrl = await getDownloadURL(imageSnap.ref);

      // 5. UPDATE PIPELINE: Sync the URL back to the Firestore document
      await updateDoc(doc(db, "daily_logs", docRef.id), {
        summary_card_url: summaryUrl,
      });

      // 6. BROADCAST PIPELINE: Send final data to Discord Webhook
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
        
        {/* Terminal Header */}
        <header className="border-b-4 border-brown-dark pb-4 flex justify-between items-center">
          <h1 className="text-2xl font-black uppercase tracking-tighter">nfx // Session_Input_Terminal</h1>
          <button 
            type="button" 
            onClick={() => router.push("/")} 
            className="text-[10px] border border-brown-dark px-2 py-1 hover:bg-brown-dark hover:text-beige-retro transition-colors"
          >
            ABORT_TO_FEED
          </button>
        </header>

        {/* Global Context Inputs */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brown-medium">// Daily_Bias</label>
            <input 
              required
              className="w-full bg-beige-muted border-2 border-brown-dark p-3 outline-none focus:bg-white placeholder:opacity-30"
              placeholder="e.g., BULLISH - HTF Liquidity Sweep"
              onChange={(e) => setDailyBias(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brown-medium">// Red_Folder_News</label>
            <input 
              className="w-full bg-beige-muted border-2 border-brown-dark p-3 outline-none focus:bg-white placeholder:opacity-30"
              placeholder="e.g., 10:30PM USD CPI (High Vol)"
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
                    className="w-full bg-beige-retro border border-brown-light p-2 text-sm outline-none uppercase font-bold"
                    value={trade.pair}
                    onChange={(e) => handleTradeChange(index, "pair", e.target.value)}
                  />
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    placeholder="P/L Amount (%)"
                    className="w-full bg-beige-retro border border-brown-light p-2 text-sm outline-none"
                    onChange={(e) => handleTradeChange(index, "pl", e.target.value)}
                  />
                  <div className="border border-brown-light p-3 bg-beige-retro">
                    <label className="block text-[9px] uppercase font-black text-brown-medium mb-2">Attach_Chart_Snapshot</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="text-[10px] w-full file:bg-brown-dark file:text-beige-retro file:border-0 file:px-2 file:py-1 file:mr-4 file:uppercase file:font-black cursor-pointer"
                      onChange={(e) => handleTradeChange(index, "file", e.target.files?.[0])}
                    />
                  </div>
                </div>
                <textarea 
                  required
                  placeholder="Confluences (iFVG, SMT Divergence, MSS...)"
                  className="w-full bg-beige-retro border border-brown-light p-3 text-sm outline-none h-full min-h-[120px] resize-none"
                  onChange={(e) => handleTradeChange(index, "confluences", e.target.value)}
                />
              </div>
            </div>
          ))}

          {/* Add Trade Button */}
          <button 
            type="button" 
            onClick={addTradeSlot}
            className="w-full border-2 border-dashed border-brown-medium p-4 text-brown-medium hover:bg-brown-dark hover:text-beige-retro transition-all uppercase font-black text-xs tracking-widest"
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
              relative w-full p-6 border-4 border-brown-dark font-black text-xl uppercase tracking-[0.4em] transition-all
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
    </div>
  );
}