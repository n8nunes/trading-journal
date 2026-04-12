import { ImageResponse } from '@vercel/og';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { daily_bias, trades, date_str } = data;

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
          fontFamily: 'monospace',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '25px' }}>
            <span style={{ fontSize: 44, fontWeight: 'black', color: brown_dark, letterSpacing: '-0.05em' }}>nfx // SESSION_SUMMARY</span>
            <span style={{ fontSize: 22, fontWeight: 'bold', color: brown_dark, opacity: 0.7 }}>LOG_{date_str}</span>
          </div>

          {/* Primary Data Row */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            {/* Daily Bias Box */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', backgroundColor: 'white', border: `3px solid ${brown_dark}`, padding: '15px' }}>
              <span style={{ fontSize: 12, color: '#967451', fontWeight: 800, textTransform: 'uppercase' }}>Daily Bias</span>
              <span style={{ fontSize: 20, marginTop: '5px', color: brown_dark }}>{daily_bias.toUpperCase()}</span>
            </div>
            
            {/* Net Result Box */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white', border: `3px solid ${brown_dark}`, padding: '15px' }}>
              <span style={{ fontSize: 12, color: '#967451', fontWeight: 800, textTransform: 'uppercase' }}>Net Result</span>
              <span style={{ fontSize: 24, fontWeight: 900, marginTop: '5px', color: isProfitable ? '#15803d' : '#b91c1c' }}>
                {isProfitable ? '+' : ''}{totalPL.toLocaleString()}%
              </span>
            </div>
          </div>

          {/* Trades Execution List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: 12, fontWeight: 900, borderBottom: `2px solid ${brown_dark}`, paddingBottom: '5px', color: '#967451' }}>
              <span style={{ width: '150px' }}>INSTRUMENT</span>
              <span style={{ width: '120px' }}>P/L (%)</span>
              <span style={{ flex: 1 }}>CONFLUENCES_LOG</span>
            </div>

            {trades.slice(0, 5).map((trade: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', fontSize: 16, borderBottom: '1px solid #D9D1C7', padding: '10px 0', alignItems: 'flex-start' }}>
                <span style={{ width: '150px', fontWeight: 800, color: brown_dark }}>{trade.pair.toUpperCase()}</span>
                <span style={{ width: '120px', fontWeight: 700, color: trade.pl >= 0 ? '#15803d' : '#b91c1c' }}>
                  {trade.pl >= 0 ? '+' : ''}{trade.pl}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: '#555', lineHeight: 1.3 }}>
                  {trade.confluences || "No confluences recorded."}
                </span>
              </div>
            ))}
          </div>

          {/* Footer Metadata */}
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: `2px solid ${brown_dark}`, paddingTop: '15px', opacity: 0.6 }}>
            <span style={{ fontSize: 11 }}>NFX_MECHANICAL_TERMINAL_V1.2</span>
            <span style={{ fontSize: 11 }}>SYNC_STATUS: ENCRYPTED_ARCHIVE_CONFIRMED</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('GEN_ERROR:', error);
    return new Response(`Generation Chain Error: ${error.message}`, { status: 500 });
  }
}