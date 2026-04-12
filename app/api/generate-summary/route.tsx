import { ImageResponse } from '@vercel/og';

// Vercel requires the Edge runtime for @vercel/og to function correctly in production
export const runtime = 'edge'; 

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // GUARD: Ensure we have data before processing to avoid 500s
    const daily_bias = data.daily_bias || "UNDETERMINED";
    const trades = data.trades || [];
    const date_str = data.date_str || new Date().toLocaleDateString('en-GB');

    const totalPL = trades.reduce((sum: number, t: any) => sum + (Number(t.pl) || 0), 0) || 0;
    const isProfitable = totalPL >= 0;
    const brown_dark = '#4A3721';

    return new ImageResponse(
      (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F2EEE8', 
          border: `12px solid ${brown_dark}`,
          padding: '40px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '25px' }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: brown_dark }}>nfx // SUMMARY</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: brown_dark, opacity: 0.7 }}>LOG_{date_str}</span>
          </div>

          {/* Data Row */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', backgroundColor: 'white', border: `3px solid ${brown_dark}`, padding: '15px' }}>
              <span style={{ fontSize: 12, color: '#967451', fontWeight: 800 }}>DAILY BIAS</span>
              <span style={{ fontSize: 20, marginTop: '5px', color: brown_dark }}>{daily_bias.toUpperCase()}</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white', border: `3px solid ${brown_dark}`, padding: '15px' }}>
              <span style={{ fontSize: 12, color: '#967451', fontWeight: 800 }}>NET RESULT</span>
              <span style={{ fontSize: 24, fontWeight: 900, marginTop: '5px', color: isProfitable ? '#15803d' : '#b91c1c' }}>
                {isProfitable ? '+' : ''}{totalPL.toLocaleString()}%
              </span>
            </div>
          </div>

          {/* Trade List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {trades.length > 0 ? (
              trades.slice(0, 4).map((trade: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', fontSize: 16, borderBottom: '1px solid #D9D1C7', padding: '10px 0' }}>
                  <span style={{ width: '150px', fontWeight: 800, color: brown_dark }}>{trade.pair?.toUpperCase()}</span>
                  <span style={{ width: '120px', fontWeight: 700, color: trade.pl >= 0 ? '#15803d' : '#b91c1c' }}>
                    {trade.pl >= 0 ? '+' : ''}{trade.pl}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: '#555' }}>
                    {trade.confluences?.substring(0, 100) || "Executed per system."}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', fontSize: 14, fontStyle: 'italic', opacity: 0.5 }}>NO_TRADES_RECORDED_THIS_SESSION</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: `2px solid ${brown_dark}`, paddingTop: '15px', opacity: 0.6 }}>
            <span style={{ fontSize: 11 }}>NFX_MECHANICAL_TERMINAL_V1.2</span>
            <span style={{ fontSize: 11 }}>SYNC_STATUS: ENCRYPTED_ARCHIVE</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error: any) {
    // This allows us to see the error in Vercel Logs instead of just getting a generic 500
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}