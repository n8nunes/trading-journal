async function test() {
  try {
    const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
    });
    
    if (!res.ok) {
        console.log("Fetch failed", res.status, res.statusText);
        return;
    }
    
    const events = await res.json();
    console.log("Events count:", Object.keys(events).length);
    
    const formatter = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/New_York', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
    const todayEdT = formatter.format(new Date());
    console.log("Today in EDT formatted by en-CA:", todayEdT);
    
    const targetCurrencies = ["USD", "EUR", "GBP"];
    
    const redFolderNews = events
        .filter((e) => e.impact === "High")
        .filter((e) => targetCurrencies.includes(e.country))
        .filter((e) => e.date.startsWith(todayEdT)); 

    console.log("Detected Red Folder News:");
    console.log(redFolderNews);
  } catch (err) {
      console.error(err);
  }
}

test();
