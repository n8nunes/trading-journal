"use client";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Define the structure of a journal entry
interface JournalEntry {
  id: string;
  asset: string;
  date: any;
  context: {
    market_narrative: string;
  };
  technical_execution: {
    confluences: string;
  };
  media?: {
    chart_url: string;
  };
  review: {
    is_published: boolean;
  };
}

export default function PublicFeed() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        // Query: Show published logs, newest at the top
        const q = query(
          collection(db, "journal_entries"),
          where("review.is_published", "==", true),
          orderBy("date", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedEntries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as JournalEntry[];

        setEntries(fetchedEntries);
      } catch (error) {
        console.error("Error fetching terminal data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-retro flex items-center justify-center font-mono text-brown-dark">
        <p className="animate-pulse tracking-widest text-xl uppercase">Establishing_Connection...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-beige-retro text-brown-dark p-6 md:p-12 font-mono">
      <div className="max-w-5xl mx-auto">
        {/* Terminal Header */}
        <header className="border-b-4 border-brown-dark pb-6 mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
              TRADING_LOG_v1.0
            </h1>
            <p className="text-sm mt-2 font-bold bg-brown-dark text-beige-retro px-2 py-1 inline-block uppercase">
              Authenticated Session // SMC_ICT_STRATEGY
            </p>
          </div>
          <div className="text-right uppercase text-xs space-y-1 font-bold">
            <p className="text-brown-medium">Location: Mulgrave_AU</p>
            <p className="text-brown-medium">Status: Feed_Active</p>
          </div>
        </header>

        {/* Trade Feed */}
        <div className="grid gap-16">
          {entries.length === 0 ? (
            <div className="border-2 border-dashed border-brown-light p-10 text-center">
              <p className="text-brown-medium uppercase italic">No data entries synced to local terminal.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <article 
                key={entry.id} 
                className="group border-2 border-brown-dark bg-beige-muted shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] hover:shadow-none transition-all"
              >
                {/* Entry Header */}
                <div className="bg-brown-dark text-beige-retro p-4 flex justify-between items-center">
                  <h2 className="text-2xl font-black italic tracking-widest uppercase">
                    {entry.asset} <span className="text-xs font-normal opacity-70">/ USD</span>
                  </h2>
                  <span className="text-sm font-bold border border-beige-retro px-3 py-1">
                    {entry.date?.toDate().toLocaleDateString('en-GB')}
                  </span>
                </div>

                {/* Main Content Area */}
                <div className="p-6">
                  {/* Image Container: Matches your chart aesthetics */}
                  {entry.media?.chart_url && (
                    <div className="mb-8 border-2 border-brown-dark bg-brown-medium overflow-hidden">
                      <img 
                        src={entry.media.chart_url} 
                        alt={`${entry.asset} Technical Setup`} 
                        className="w-full h-auto grayscale-[0.2] hover:grayscale-0 transition-all duration-500 cursor-zoom-in"
                      />
                    </div>
                  )}

                  {/* Narrative & Execution Split */}
                  <div className="grid md:grid-cols-2 gap-10">
                    <section>
                      <h3 className="text-brown-medium font-black mb-3 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 bg-brown-medium"></span> // Market Narrative
                      </h3>
                      <div className="p-4 border border-brown-light bg-beige-retro text-sm leading-relaxed min-h-[100px]">
                        {entry.context.market_narrative}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-brown-medium font-black mb-3 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 bg-brown-medium"></span> // Technical Confluences
                      </h3>
                      <div className="p-4 border border-brown-light bg-beige-retro text-sm leading-relaxed min-h-[100px]">
                        {entry.technical_execution.confluences}
                      </div>
                    </section>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="bg-beige-retro border-t-2 border-brown-dark p-3 text-[10px] uppercase font-bold text-brown-medium flex justify-between">
                  <span>LOG_REF: {entry.id.substring(0, 8)}...</span>
                  <span>Terminal_Encrypted: YES</span>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Page Footer */}
        <footer className="mt-20 pt-8 border-t border-brown-light text-center">
          <p className="text-[10px] text-brown-medium uppercase tracking-widest">
            © 2026 Personal Trading Journal // Systematic Risk Management is Key
          </p>
        </footer>
      </div>
    </main>
  );
}