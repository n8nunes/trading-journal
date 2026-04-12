"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PublicFeed() {
  const [logs, setLogs] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // State for navigating months
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const fetchLogs = async () => {
      const q = query(collection(db, "daily_logs"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      setLogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchLogs();
  }, []);

  // Calendar Helpers
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
    setSelectedDate(null); // Clear selection when flipping pages
  };

  const logDates = logs.map(l => l.date?.toDate().toDateString());

  // Filter logs based on selection
  const filteredLogs = logs.filter(log => 
    !selectedDate || log.date?.toDate().toDateString() === selectedDate
  );

  return (
    <main className="min-h-screen bg-beige-retro text-brown-dark p-6 md:p-12 font-mono">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Header */}
        <header className="border-b-4 border-brown-dark pb-6 mb-12 flex justify-between items-end">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Trading_Journal</h1>
          <div className="flex border-2 border-brown-dark overflow-hidden bg-brown-medium">
            <button 
              onClick={() => { setView("list"); setSelectedDate(null); }}
              className={`px-4 py-2 text-xs font-black ${view === "list" ? "bg-brown-dark text-brown-medium" : "hover:bg-beige-muted"}`}
            >
              LIST
            </button>
            <button 
              onClick={() => setView("calendar")}
              className={`px-4 py-2 text-xs font-black border-l-2 border-brown-dark ${view === "calendar" ? "bg-brown-dark text-brown-medium" : "hover:bg-beige-muted"}`}
            >
              CALENDAR
            </button>
          </div>
        </header>

        {view === "calendar" && (
          <div className="bg-beige-muted border-2 border-brown-dark p-8 shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] mb-12">
            
            {/* Calendar Controls */}
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => changeMonth(-1)} className="hover:text-brown-medium font-black">{"< PREV"}</button>
              <h2 className="text-xl font-black uppercase tracking-widest">
                {viewDate.toLocaleString('default', { month: 'long' })} {year}
              </h2>
              <button onClick={() => changeMonth(1)} className="hover:text-brown-medium font-black">{"NEXT >"}</button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4 text-center text-[10px] font-black uppercase text-brown-medium">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {/* Empty spaces for start of month */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square border border-transparent"></div>
              ))}
              
              {/* Actual Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(year, month, day);
                const dateString = dateObj.toDateString();
                const hasLog = logDates.includes(dateString);
                const isSelected = selectedDate === dateString;
                
                return (
                  <div 
                    key={day}
                    onClick={() => hasLog && setSelectedDate(dateString)}
                    className={`aspect-square border flex flex-col items-center justify-center transition-all relative
                      ${hasLog ? "border-brown-dark bg-brown-light/40 cursor-pointer hover:bg-brown-light" : "border-brown-light/30 opacity-40 cursor-not-allowed"}
                      ${isSelected ? "bg-brown-dark text-brown-medium ring-2 ring-offset-2 ring-brown-dark scale-105 z-10" : ""}
                    `}
                  >
                    <span className="text-xs font-black">{day}</span>
                    {hasLog && (
                      <span className={`text-[8px] absolute bottom-1 ${isSelected ? "text-beige-retro" : "text-brown-dark"}`}>
                        ●
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Date Reset */}
            {selectedDate && (
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-[10px] border border-brown-dark px-3 py-1 uppercase font-black hover:bg-brown-dark hover:text-brown-medium"
                >
                  Show All {viewDate.toLocaleString('default', { month: 'long' })} Entries
                </button>
              </div>
            )}
          </div>
        )}

        {/* The Feed Section */}
        <div className="space-y-16">
          {filteredLogs.length === 0 ? (
            <div className="border-4 border-dashed border-brown-light p-20 text-center bg-beige-muted/50">
              <p className="text-brown-medium font-black uppercase tracking-[0.2em]">
                {selectedDate ? `No session logs for ${new Date(selectedDate).toLocaleDateString()}` : "No Entries."}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <article key={log.id} className="border-2 border-brown-dark bg-beige-muted shadow-[8px_8px_0px_0px_rgba(74,55,33,1)]">
                {/* Session Header */}
                <div className="bg-brown-dark text-beige-retro p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black italic tracking-widest uppercase">
                      LOG_{log.date?.toDate().toLocaleDateString('en-GB')}
                    </span>
                    <span className="text-[10px] border border-beige-retro px-2 py-1 uppercase font-black opacity-70">
                      {log.daily_bias}
                    </span>
                  </div>
                </div>
                
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
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
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}