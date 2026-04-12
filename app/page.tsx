"use client";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PublicFeed() {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    const fetchEntries = async () => {
      const q = query(collection(db, "journal_entries"), where("review.is_published", "==", true), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      setEntries(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchEntries();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 font-mono">
      <div className="max-w-5xl mx-auto">
        <header className="border-b border-slate-800 pb-4 mb-8 flex justify-between items-end">
          <h1 className="text-2xl font-bold tracking-tighter text-blue-400">TRADING_LOG_v1.0</h1>
          <p className="text-xs text-slate-500 uppercase">System Status: Operational</p>
        </header>

        <div className="grid gap-12">
          {entries.map((entry) => (
            <article key={entry.id} className="border-l-2 border-slate-800 pl-6 py-2 hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-baseline mb-4">
                <h2 className="text-3xl font-black text-white italic">{entry.asset} <span className="text-sm font-normal text-slate-500">/ USD</span></h2>
                <span className="text-sm text-blue-500 font-bold">{entry.date?.toDate().toLocaleDateString()}</span>
              </div>

              {entry.media?.chart_url && (
                <div className="mb-6 rounded border border-slate-800 overflow-hidden">
                  <img src={entry.media.chart_url} alt="Chart Analysis" className="w-full grayscale hover:grayscale-0 transition-all duration-500" />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8 text-sm">
                <div>
                  <h3 className="text-blue-400 font-bold mb-2 uppercase text-xs tracking-widest">// Market Narrative</h3>
                  <p className="leading-relaxed text-slate-400">{entry.context.market_narrative}</p>
                </div>
                <div>
                  <h3 className="text-blue-400 font-bold mb-2 uppercase text-xs tracking-widest">// Technical Confluences</h3>
                  <p className="leading-relaxed text-slate-400">{entry.technical_execution.confluences}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}