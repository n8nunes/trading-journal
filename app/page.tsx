"use client";
import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, where, getDocs } from "firebase/firestore";
import { db, auth, ADMIN_UID } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function PublicFeed() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setIsAdmin(user.uid === ADMIN_UID);
        
        const q = query(
                    collection(db, "daily_logs"), 
                    where("userId", "==", user.uid), 
                    orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);
        setLogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        setIsLoading(false);
      } else {
        router.push("/login");
      }
    });

    return () => unsub();
  }, [router]);

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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
    setSelectedDate(null);
  };

  const toggleLog = (logId: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const filteredLogs = logs.filter(log => 
    !selectedDate || log.date?.toDate().toDateString() === selectedDate
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige-retro font-mono">
        <div className="text-center p-8 border-2 border-brown-dark shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] bg-beige-muted">
          <p className="text-brown-dark font-black tracking-widest uppercase animate-pulse">
            // DECRYPTING_JOURNAL_DATA...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-beige-retro text-brown-dark p-6 md:p-12 font-mono animate-fade-in-up">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Header */}
        <header className="border-b-4 border-brown-dark pb-6 mb-12 flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tighter uppercase">Trading_Journal</h1>
            
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <button 
                    onClick={() => router.push("/dashboard")}
                    className="w-fit text-[10px] font-black bg-beige-retro text-brown-dark px-3 py-1 uppercase border-2 border-brown-dark hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
                  >
                    [ VIEW_DASHBOARD ]
                  </button>
                  <button 
                    onClick={() => router.push("/admin/settings")}
                    className="w-fit text-[10px] font-black bg-beige-retro text-brown-dark px-3 py-1 uppercase border-2 border-brown-dark hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
                  >
                    [ ACCESS_SETTINGS ]
                  </button>
                  <button 
                    onClick={() => router.push("/admin")}
                    className="w-fit text-[10px] font-black bg-brown-dark text-beige-retro px-3 py-1 uppercase border-2 border-brown-dark hover:bg-brown-medium cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
                  >
                    + Initialize_New_Log
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex border-2 border-brown-dark overflow-hidden w-fit shadow-[4px_4px_0px_0px_rgba(74,55,33,1)]">
            <button 
              onClick={() => { setView("list"); setSelectedDate(null); }}
              className={`px-4 py-2 text-xs font-black cursor-pointer uppercase transition-all duration-150 ${
                view === "list" 
                  ? "bg-brown-dark text-brown-medium shadow-[inset_3px_3px_0px_0px_rgba(30,20,10,0.5)]" 
                  : "bg-brown-medium text-brown-dark hover:bg-beige-muted"
              }`}
            >
              LIST
            </button>
            <button 
              onClick={() => setView("calendar")}
              className={`px-4 py-2 text-xs font-black cursor-pointer uppercase border-l-2 border-brown-dark transition-all duration-150 ${
                view === "calendar" 
                  ? "bg-brown-dark text-brown-medium shadow-[inset_3px_3px_0px_0px_rgba(30,20,10,0.5)]" 
                  : "bg-brown-medium text-brown-dark hover:bg-beige-muted"
              }`}
            >
              CALENDAR
            </button>
          </div>
        </header>

        {view === "calendar" && (
          <div className="bg-beige-muted border-2 border-brown-dark p-8 shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] mb-12 animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => changeMonth(-1)} className="hover:text-brown-medium font-black cursor-pointer transition-transform duration-200 hover:-translate-x-1 active:translate-x-0">
                {"< PREV"}
              </button>
              <h2 className="text-xl font-black uppercase tracking-widest transition-all">
                {viewDate.toLocaleString('default', { month: 'long' })} {year}
              </h2>
              <button onClick={() => changeMonth(1)} className="hover:text-brown-medium font-black cursor-pointer transition-transform duration-200 hover:translate-x-1 active:translate-x-0">
                {"NEXT >"}
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4 text-center text-[10px] font-black uppercase text-brown-medium">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square border border-transparent"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(year, month, day);
                const dateString = dateObj.toDateString();
                const hasLog = dateString in dailyStats;
                const totalPl = dailyStats[dateString] || 0;
                const isProfitable = totalPl > 0;
                const isNegative = totalPl < 0;
                const isSelected = selectedDate === dateString;
                
                return (
                  <div 
                    key={day}
                    onClick={() => hasLog && setSelectedDate(dateString)}
                    className={`aspect-square border flex flex-col items-center justify-center transition-all duration-200 relative
                      ${hasLog 
                        ? isProfitable 
                          ? "border-green-800 bg-green-100/40 cursor-pointer hover:bg-green-200/60 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(22,101,52,1)]" 
                          : isNegative 
                            ? "border-red-800 bg-red-100/40 cursor-pointer hover:bg-red-200/60 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(153,27,27,1)]"
                            : "border-brown-dark bg-brown-light/40 cursor-pointer hover:bg-brown-light hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)]"
                        : "border-brown-light/30 opacity-40 cursor-not-allowed"}
                      ${isSelected ? "bg-brown-dark text-brown-medium ring-2 ring-offset-2 ring-brown-dark scale-105 z-10 !shadow-none !translate-y-0" : "hover:z-10"}
                    `}
                  >
                    <span className="text-xs font-black">{day}</span>
                    {hasLog && (
                      <span className={`text-[8px] font-bold mt-1 ${
                        isSelected ? "text-beige-retro" : isProfitable ? "text-green-800" : isNegative ? "text-red-800" : "text-brown-dark"
                      }`}>
                        {totalPl > 0 ? "+" : ""}{totalPl.toFixed(1)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-6 text-center animate-fade-in-up">
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-[10px] border-2 border-brown-dark px-3 py-1 uppercase font-black hover:bg-brown-dark hover:text-brown-medium cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
                >
                  Show All {viewDate.toLocaleString('default', { month: 'long' })} Entries
                </button>
              </div>
            )}
          </div>
        )}

        <div key={`feed-${view}-${selectedDate || 'all'}`} className="space-y-16">
          {filteredLogs.length === 0 ? (
            <div className="border-4 border-dashed border-brown-light p-20 text-center bg-beige-muted/50 animate-fade-in-up">
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
                  className="border-2 border-brown-dark bg-beige-muted shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] animate-in transition-all duration-300 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(74,55,33,1)]"
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
                    <span className="text-xl font-black transition-transform duration-300">
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