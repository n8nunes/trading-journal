"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth, ADMIN_UID } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type Range = "7D" | "30D" | "YTD" | "ALL";

export default function TraderDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [range, setRange] = useState<Range>("30D");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAdmin(user.uid === ADMIN_UID);
        
        try {
          // Fetching all logs for the user to process them client-side based on range
          const q = query(
            collection(db, "daily_logs"),
            where("userId", "==", user.uid),
            orderBy("date", "desc")
          );
          const snapshot = await getDocs(q);
          setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Error fetching logs:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsub();
  }, [router]);

  // Calculate statistics based on selected range
  const stats = useMemo(() => {
    const now = new Date();
    let cutoff = new Date(0); // ALL
    
    if (range === "7D") cutoff = new Date(now.setDate(now.getDate() - 7));
    if (range === "30D") cutoff = new Date(now.setDate(now.getDate() - 30));
    if (range === "YTD") cutoff = new Date(now.getFullYear(), 0, 1);

    const filteredLogs = logs.filter(log => log.date?.toDate() >= cutoff);

    let totalPl = 0;
    let todayPl = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let totalWinPl = 0;
    let totalLossPl = 0;
    let bearishCount = 0;
    let bullishCount = 0;

    const todayStr = new Date().toDateString();

    filteredLogs.forEach(log => {
      const logDate = log.date?.toDate().toDateString();
      const isToday = logDate === todayStr;

      // Calculate bias tally
      const bias = (log.daily_bias || "").toUpperCase();
      if (bias.includes("BEAR") || bias.includes("SHORT")) bearishCount++;
      if (bias.includes("BULL") || bias.includes("LONG")) bullishCount++;

      (log.trades || []).forEach((trade: any) => {
        const pl = Number(trade.pl) || 0;
        totalPl += pl;
        if (isToday) todayPl += pl;

        if (pl > 0) {
          winningTrades++;
          totalWinPl += pl;
        } else if (pl < 0) {
          losingTrades++;
          totalLossPl += pl;
        }
      });
    });

    const totalTrades = winningTrades + losingTrades;
    const winRatio = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgWin = winningTrades > 0 ? totalWinPl / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLossPl / losingTrades : 0;
    
    let overallBias = "NEUTRAL";
    if (bearishCount > bullishCount) overallBias = "BEARISH";
    if (bullishCount > bearishCount) overallBias = "BULLISH";

    return { totalPl, todayPl, winRatio, avgWin, avgLoss, overallBias, totalTrades };
  }, [logs, range]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige-retro font-mono">
        <div className="text-center p-8 border-2 border-brown-dark shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] bg-beige-muted">
          <p className="text-brown-dark font-black tracking-widest uppercase animate-pulse">
            // COMPILING_DASHBOARD_METRICS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-beige-retro text-brown-dark p-6 md:p-12 font-mono">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header & Navigation */}
        <header className="border-b-4 border-brown-dark pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tighter uppercase">MAIN_DASHBOARD</h1>
            <p className="text-xs font-black uppercase text-brown-medium tracking-widest">
              // PERFORMANCE_ANALYTICS
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => router.push("/")}
              className="w-fit text-[10px] font-black bg-beige-retro text-brown-dark px-3 py-1 uppercase border-2 border-brown-dark hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
            >
              [ VIEW_FEED ]
            </button>
            {isAdmin && (
              <button 
                onClick={() => router.push("/admin/settings")}
                className="w-fit text-[10px] font-black bg-beige-retro text-brown-dark px-3 py-1 uppercase border-2 border-brown-dark hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
              >
                [ SETTINGS ]
              </button>
            )}
            <button 
              onClick={() => auth.signOut()}
              className="w-fit text-[10px] font-black bg-beige-retro text-brown-dark px-3 py-1 uppercase border-2 border-brown-dark hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none bg-red-700/40"
            >
              [ LOGOUT ]
            </button>
          </div>
        </header>

        {/* Range Selector */}
        <div className="flex border-2 border-brown-dark overflow-hidden w-fit shadow-[4px_4px_0px_0px_rgba(74,55,33,1)]">
          {(["7D", "30D", "YTD", "ALL"] as Range[]).map((r, i) => (
            <button 
              key={r}
              onClick={() => setRange(r)}
              className={`px-6 py-2 text-xs font-black cursor-pointer uppercase transition-all duration-150 ${
                i !== 0 ? 'border-l-2 border-brown-dark' : ''
              } ${
                range === r 
                  ? "bg-brown-dark text-brown-medium shadow-[inset_3px_3px_0px_0px_rgba(30,20,10,0.5)]" 
                  : "bg-brown-medium text-brown-dark hover:bg-beige-muted"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Today's Profit */}
          <div className={`transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] border-2 border-brown-dark p-6 shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] ${stats.todayPl >= 0 ? (stats.todayPl === 0 ? "bg-beige-muted" : "bg-green-100/40") : "bg-red-100/40"}`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brown-medium mb-2">// TODAY'S_PROFIT</h3>
            <p className={`text-4xl font-black tracking-tighter ${stats.todayPl > 0 ? "text-green-800" : stats.todayPl < 0 ? "text-red-800" : "text-brown-dark"}`}>
              {stats.todayPl > 0 ? "+" : ""}{stats.todayPl.toFixed(2)}%
            </p>
          </div>

          {/* Cumulative P/L (Range) */}
          <div className="transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] border-2 border-brown-dark p-6 bg-beige-muted shadow-[8px_8px_0px_0px_rgba(74,55,33,1)]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brown-medium mb-2">// NET_P/L_({range})</h3>
            <p className={`text-4xl font-black tracking-tighter ${stats.totalPl >= 0 ? "text-green-800" : "text-red-800"}`}>
              {stats.totalPl > 0 ? "+" : ""}{stats.totalPl.toFixed(2)}%
            </p>
          </div>

          {/* Win Ratio */}
          <div className="transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] border-2 border-brown-dark p-6 bg-beige-muted shadow-[8px_8px_0px_0px_rgba(74,55,33,1)]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brown-medium mb-2">// WIN_RATIO</h3>
            <p className="text-4xl font-black tracking-tighter text-brown-dark">
              {stats.winRatio.toFixed(1)}%
            </p>
            <p className="text-[10px] font-black mt-2 text-brown-medium uppercase">
              BASED_ON_{stats.totalTrades}_TRADES
            </p>
          </div>

          {/* Avg Win vs Avg Loss */}
          <div className="transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] border-2 border-brown-dark p-6 bg-beige-muted shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] flex flex-col justify-center">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-brown-medium mb-4">// AVG_WIN_VS_LOSS</h3>
             <div className="flex justify-between items-center border-b-2 border-dashed border-brown-light pb-2 mb-2">
                <span className="text-sm font-black uppercase text-green-800">AVG_WIN</span>
                <span className="text-lg font-black text-green-800">+{stats.avgWin.toFixed(2)}%</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase text-red-800">AVG_LOSS</span>
                <span className="text-lg font-black text-red-800">{stats.avgLoss.toFixed(2)}%</span>
             </div>
          </div>

          {/* Overall Bias */}
          <div className="transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] border-2 border-brown-dark p-6 bg-beige-muted shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] flex flex-col justify-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brown-medium mb-2">// PRIMARY_BIAS</h3>
            <p className="text-3xl font-black tracking-tighter text-brown-dark uppercase">
              {stats.overallBias}
            </p>
            <p className="text-[10px] font-black mt-2 text-brown-medium uppercase">
              HIGHEST_FREQUENCY_DIRECTION
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}