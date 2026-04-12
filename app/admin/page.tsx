"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage, ADMIN_UID } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
  const [trades, setTrades] = useState<TradeEntry[]>([{ pair: "EURUSD", pl: "", confluences: "", file: null }]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user || user.uid !== ADMIN_UID) router.push("/login");
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

      await addDoc(collection(db, "daily_logs"), {
        date: serverTimestamp(),
        daily_bias: dailyBias,
        news_events: news,
        trades: processedTrades,
      });

      alert("Daily Terminal Log Synced.");
      router.push("/");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige-retro text-brown-dark p-6 md:p-12 font-mono">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        <header className="border-b-4 border-brown-dark pb-4 flex justify-between items-center">
          <h1 className="text-2xl font-black uppercase">Daily_Session_Input</h1>
          <button type="button" onClick={() => router.push("/")} className="text-xs border border-brown-dark px-2 py-1 hover:bg-brown-dark hover:text-brown-medium">EXIT_TO_FEED</button>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest">// Daily Bias</label>
            <input 
              className="w-full bg-beige-muted border-2 border-brown-dark p-3 outline-none focus:bg-brown-medium"
              placeholder="e.g., BULLISH - HTF Liquidity Sweep"
              onChange={(e) => setDailyBias(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest">// Red Folder News</label>
            <input 
              className="w-full bg-beige-muted border-2 border-brown-dark p-3 outline-none focus:bg-brown-medium"
              placeholder="e.g., 10:30PM USD CPI"
              onChange={(e) => setNews(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-black bg-brown-dark text-beige-retro px-4 py-1 inline-block uppercase tracking-tighter">Trades_List</h2>
          
          {trades.map((trade, index) => (
            <div key={index} className="p-6 border-2 border-brown-dark bg-beige-muted space-y-4 shadow-[4px_4px_0px_0px_rgba(74,55,33,1)]">
              <div className="flex justify-between items-center border-b border-brown-light pb-2">
                <span className="font-black text-xs uppercase text-brown-medium">Trade_{index + 1}</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <input 
                    placeholder="Pair (e.g. EURUSD)"
                    className="w-full bg-beige-retro border border-brown-light p-2 text-sm outline-none"
                    value={trade.pair}
                    onChange={(e) => handleTradeChange(index, "pair", e.target.value)}
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="P/L (% Amount)"
                    className="w-full bg-beige-retro border border-brown-light p-2 text-sm outline-none"
                    onChange={(e) => handleTradeChange(index, "pl", e.target.value)}
                  />
                  <div className="border border-brown-light p-2 bg-beige-retro">
                    <label className="block text-[10px] uppercase font-black text-brown-medium mb-1">Chart_Screenshot</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="text-[10px] w-full file:bg-brown-medium file:text-brown-medium file:border-0 file:p-1"
                      onChange={(e) => handleTradeChange(index, "file", e.target.files?.[0])}
                    />
                  </div>
                </div>
                <textarea 
                  placeholder="Confluences (iFVG, SMT, MSS...)"
                  className="bg-beige-retro border border-brown-light p-3 text-sm outline-none h-full"
                  onChange={(e) => handleTradeChange(index, "confluences", e.target.value)}
                />
              </div>
            </div>
          ))}

          <button 
            type="button" 
            onClick={addTradeSlot}
            className="w-full border-2 border-dashed border-brown-medium p-4 text-brown-medium hover:bg-brown-light hover:text-brown-medium transition-all uppercase font-black text-sm"
          >
            + New Trade Slot
          </button>
        </div>

        <div className="relative group pt-10">
    {/* The Static Shadow Layer */}
    <div className="absolute inset-0 bg-brown-medium translate-x-3 translate-y-3 mt-10" />

        {/* The Interactive Button Layer */}
        <button
            type="submit"
            disabled={loading}
            className={`
            relative w-full p-6 border-4 border-brown-dark font-black text-xl uppercase tracking-[0.4em] transition-all
            ${loading 
                ? "bg-brown-medium text-beige-retro translate-x-2 translate-y-2" 
                : "bg-brown-dark text-beige-retro hover:-translate-x-1 hover:-translate-y-1 active:translate-x-2 active:translate-y-2 shadow-none"}
            `}
        >
            {loading ? (
            <span className="flex items-center justify-center gap-3">
                <span className="animate-pulse">_</span>
                SYNCING_TO_MAINframe...
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