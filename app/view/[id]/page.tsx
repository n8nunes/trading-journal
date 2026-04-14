"use client";
import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useParams } from "next/navigation";

export default function ViewerFeed() {
  const router = useRouter();
  const params = useParams();
  const traderId = params.id as string; 
  
  const [logs, setLogs] = useState<any[]>([]);
  const [traderEmail, setTraderEmail] = useState<string>("Unknown_Trader");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const fetchTraderInfoAndLogs = async () => {
      try {
        // 1. Fetch Trader's Profile to get their display email
        const userDocRef = doc(db, "users", traderId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().traderEmail) {
          setTraderEmail(userDoc.data().traderEmail);
        }

        // 2. Fetch the Logs (Firebase Security Rules will automatically block this if unauthorized)
        const q = query(
          collection(db, "daily_logs"), 
          where("userId", "==", traderId),
          orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);
        setLogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
      } catch (error: any) {
        console.error("Failed to load logs", error);
        // If Firebase throws a permissions error, we know they aren't authorized
        if (error.code === 'permission-denied') {
          setAccessDenied(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (traderId) {
      fetchTraderInfoAndLogs();
    }
  }, [traderId]);

  // Calculate daily P/L totals
  const dailyStats = useMemo(() => {
    return logs.reduce((acc, log) => {
      const dateStr = log.date?.toDate().toDateString();
      if (dateStr) {
        const entryTotal = (log.trades || []).reduce((sum: number, t: any) => sum + (Number(t.pl) || 0), 0);
        acc[dateStr] = (acc[dateStr] || 0) + entryTotal;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [logs]);

  // Calendar Helpers
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
    setSelectedDate(null);
  };

  const toggleLog = (logId: string) => setExpandedLogs(prev => ({ ...prev, [logId]: !prev[logId] }));

  const filteredLogs = logs.filter(log => 
    !selectedDate || log.date?.toDate().toDateString() === selectedDate
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige-retro font-mono">
        <div className="text-center p-8 border-2 border-brown-dark shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] bg-beige-muted">
          <p className="text-brown-dark font-black tracking-widest uppercase animate-pulse">
            // ACCESSING_SECURE_RECORDS...
          </p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-beige-retro font-mono p-6">
        <div className="text-center p-12 border-2 border-red-800 shadow-[8px_8px_0px_0px_rgba(153,27,27,1)] bg-red-50 max-w-md">
          <h1 className="text-3xl font-black text-red-800 mb-4 tracking-tighter uppercase">ACCESS_DENIED</h1>
          <p className="text-xs text-red-900 mb-8 font-bold uppercase tracking-widest">
            // Missing Clearance
          </p>
          <p className="text-sm font-bold text-red-800 mb-8">
            You do not have permission to view {traderEmail}'s journal. They must add your Google email to their whitelist.
          </p>
          <button 
            onClick={() => router.push("/view")}
            className="w-full bg-red-800 text-white px-6 py-4 font-black uppercase hover:bg-red-700 transition-colors cursor-pointer"
          >
            RETURN_TO_HUB
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-beige-retro text-brown-dark p-6 md:p-12 font-mono">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Header */}
        <header className="border-b-4 border-brown-dark pb-6 mb-12 flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tighter uppercase">{traderEmail}'s Journal</h1>
            <div className="flex gap-2 text-[10px] font-black uppercase text-brown-medium">
              // READ_ONLY_VIEWER_MODE // ID: {traderId}
            </div>
            <button 
              onClick={() => router.push("/view")}
              className="mt-2 w-fit text-[10px] font-black text-brown-dark px-2 py-1 uppercase border border-brown-dark hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-colors"
            >
              {"< RETURN_TO_HUB"}
            </button>
          </div>

          <div className="flex border-2 border-brown-dark overflow-hidden bg-brown-medium">
            <button 
              onClick={() => { setView("list"); setSelectedDate(null); }}
              className={`px-4 py-2 text-xs font-black cursor-pointer ${view === "list" ? "bg-brown-dark text-brown-medium" : "hover:bg-beige-muted text-brown-dark"}`}
            >
              LIST
            </button>
            <button 
              onClick={() => setView("calendar")}
              className={`px-4 py-2 text-xs font-black border-l-2 border-brown-dark cursor-pointer ${view === "calendar" ? "bg-brown-dark text-brown-medium" : "hover:bg-beige-muted text-brown-dark"}`}
            >
              CALENDAR
            </button>
          </div>
        </header>

        {/* ... The rest of your Calendar and Feed rendering logic remains exactly the same ... */}
        
        {/* Placeholder to ensure copy-paste works perfectly. Paste your existing Calendar and filteredLogs mapping here. */}
        <div className="space-y-16">
          {filteredLogs.length === 0 ? (
            <div className="border-4 border-dashed border-brown-light p-20 text-center bg-beige-muted/50">
              <p className="text-brown-medium font-black uppercase tracking-[0.2em]">
                {selectedDate ? `No session logs for ${new Date(selectedDate).toLocaleDateString()}` : "No Entries."}
              </p>
            </div>
          ) : (
             filteredLogs.map((log, index) => {
              const isExpanded = expandedLogs[log.id] || false;
              return (
                <article 
                  key={log.id} 
                  className="border-2 border-brown-dark bg-beige-muted shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] animate-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div 
                    className="bg-brown-dark text-beige-retro p-4 flex justify-between items-center cursor-pointer hover:bg-brown-medium transition-colors terminal-hover"
                    onClick={() => toggleLog(log.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black italic tracking-widest uppercase">
                        LOG_{log.date?.toDate().toLocaleDateString('en-GB')}
                      </span>
                      <span className="text-[10px] border border-beige-retro px-2 py-1 uppercase font-black opacity-70">
                        {log.daily_bias}
                      </span>
                    </div>
                    <span className="text-xl font-black">
                      {isExpanded ? "[—]" : "[+]"}
                    </span>
                  </div>
                  
                  <div className={`log-content-wrapper ${isExpanded ? 'expanded' : ''}`}>
                    <div className="log-content-inner">
                      <div className="p-4 bg-brown-light/10 border-b border-brown-dark text-[10px] font-black text-brown-dark uppercase flex gap-4">
                        <span className="text-red-800 tracking-tighter underline">HIGH_IMPACT_NEWS:</span>
                        <span>{log.news_events || "NONE_DETECTED"}</span>
                      </div>

                      <div className="p-6 space-y-12">
                        {log.trades?.map((trade: any, idx: number) => (
                          <div key={idx} className="border-l-4 border-brown-dark pl-6 space-y-4">
                            <div className="flex justify-between items-end border-b border-brown-light pb-2">
                              <h3 className="text-3xl font-black uppercase tracking-tighter">{trade.pair}</h3>
                              <span className={`text-lg font-black ${trade.pl >= 0 ? "text-green-800" : "text-red-800"}`}>
                                {trade.pl >= 0 ? "P/L: +" : "P/L: "}{trade.pl.toLocaleString()}%
                              </span>
                            </div>

                            {trade.chart_url && (
                              <div className="border-2 border-brown-dark bg-brown-medium overflow-hidden shadow-sm">
                                <img 
                                  src={trade.chart_url} 
                                  alt="Analysis" 
                                  className="w-full h-auto grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
                                />
                              </div>
                            )}

                            <div className="bg-beige-retro p-4 border border-brown-light text-xs leading-relaxed font-mono">
                              <span className="block text-brown-medium font-black mb-2 uppercase tracking-[0.2em]">// Confluences</span>
                              {trade.confluences}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}