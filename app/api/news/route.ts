import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevents Next.js from caching the route at build time

export async function GET() {
  try {
    const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
      cache: 'no-store', // Do not cache the json fetch
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      return NextResponse.json({ data: "API Error (ForexFactory down)" });
    }
    
    const events = await res.json();
    
    // Get today's date in EDT using en-US to ensure it robustly parses to MM/DD/YYYY
    const now = new Date();
    const edt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: 'numeric', day: 'numeric'
    }).format(now);
    
    const [month, day, year] = edt.split('/');
    const todayEdT = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const targetCurrencies = ["USD", "EUR", "GBP"];
    
    const redFolderNews = events
      .filter((e: any) => e.impact === "High")
      .filter((e: any) => targetCurrencies.includes(e.country))
      .filter((e: any) => e.date && e.date.startsWith(todayEdT)); 

    if (redFolderNews.length === 0) {
       return NextResponse.json({ data: "No Red Folder News" });
    }

    const groupedNews: Record<string, string[]> = {};

    redFolderNews.forEach((e: any) => {
        const eventTime = new Date(e.date);
        const timeStr = eventTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
        const key = `${timeStr} ${e.country}`;
        
        if (!groupedNews[key]) {
            groupedNews[key] = [];
        }
        groupedNews[key].push(e.title);
    });

    const formattedEvents = Object.entries(groupedNews).map(([timeAndCountry, titles]) => {
        return `${timeAndCountry} - ${titles.join(", ")}`;
    });

    return NextResponse.json({ data: formattedEvents.join(" | ") });
  } catch (error) {
    console.error("News API Error:", error);
    return NextResponse.json({ data: "Error parsing news feed" });
  }
}
