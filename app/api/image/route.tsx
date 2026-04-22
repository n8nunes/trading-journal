import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  // 6:19 Aspect Ratio (720x2280)
  const width = 720;
  const height = 2280;

  // Exact colors from your tailwind.config.ts
  const beigeRetro = '#FAF8F5';
  const beigeMuted = '#F2EEE8';
  const brownDark = '#4A3721';
  const brownMedium = '#967451';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: beigeRetro,
          color: brownDark,
          padding: '32px',
          border: `16px solid ${brownDark}`,
          fontFamily: 'monospace',
        }}
      >
        {/* Header Section */}
        <div 
          style={{ 
            display: 'flex', 
            borderBottom: `6px solid ${brownDark}`, 
            paddingBottom: '24px', 
            marginBottom: '32px', 
            alignItems: 'center' 
          }}
        >
          
          <h1 style={{ fontSize: '42px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '-1.5px' }}>
            // Trading_Rules
          </h1>
        </div>

        {/* Rules Container - Scaled for 720px width */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flexGrow: 1 }}>
          
          {/* RULE 01 */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: beigeMuted, border: `4px solid ${brownDark}`, padding: '24px' }}>
            <span style={{ fontSize: '20px', fontWeight: '900', color: brownMedium, marginBottom: '8px', letterSpacing: '2px' }}>RULE_01</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: 1.3 }}>Check news and write down red folder events before checking charts.</span>
          </div>

          {/* RULE 02 */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: beigeMuted, border: `4px solid ${brownDark}`, padding: '24px' }}>
            <span style={{ fontSize: '20px', fontWeight: '900', color: brownMedium, marginBottom: '8px', letterSpacing: '2px' }}>RULE_02</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: 1.3 }}>Determine Daily Bias</span>
          </div>

          {/* RULE 03 */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: beigeMuted, border: `4px solid ${brownDark}`, padding: '24px' }}>
            <span style={{ fontSize: '20px', fontWeight: '900', color: brownMedium, marginBottom: '8px', letterSpacing: '2px' }}>RULE_03</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: 1.3 }}>Valid pairs: EURUSD | GBPUSD | XAUUSD | XAGUSD</span>
          </div>

          {/* RULE 04 - WITH SUB-RULES */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: beigeMuted, border: `4px solid ${brownDark}`, padding: '24px' }}>
            <span style={{ fontSize: '20px', fontWeight: '900', color: brownMedium, marginBottom: '8px', letterSpacing: '2px' }}>RULE_04</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '16px', borderBottom: `3px solid ${brownMedium}`, paddingBottom: '12px' }}>Must be trading after TDO</span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '16px', borderLeft: `4px solid ${brownMedium}` }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '22px', fontWeight: '900', color: brownMedium }}>A.</span>
                <span style={{ fontSize: '22px', fontWeight: 'bold' }}>If above TDO & bearish -{'>'} shorts.</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '22px', fontWeight: '900', color: brownMedium }}>B.</span>
                <span style={{ fontSize: '22px', fontWeight: 'bold' }}>If below TDO & bullish -{'>'} longs.</span>
              </div>
            </div>
          </div>

          {/* RULE 05 */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: beigeMuted, border: `4px solid ${brownDark}`, padding: '24px' }}>
            <span style={{ fontSize: '20px', fontWeight: '900', color: brownMedium, marginBottom: '8px', letterSpacing: '2px' }}>RULE_05</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: 1.3 }}>Must be in an iFVG in the same timeframe we are trading from.</span>
          </div>

          {/* RULE 06 */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: beigeMuted, border: `4px solid ${brownDark}`, padding: '24px' }}>
            <span style={{ fontSize: '20px', fontWeight: '900', color: brownMedium, marginBottom: '8px', letterSpacing: '2px' }}>RULE_06</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: 1.3 }}>HP iFVG is one that has broken structure.</span>
          </div>

          {/* RULE 07 */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: beigeMuted, border: `4px solid ${brownDark}`, padding: '24px' }}>
            <span style={{ fontSize: '20px', fontWeight: '900', color: brownMedium, marginBottom: '8px', letterSpacing: '2px' }}>RULE_07</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: 1.3 }}>Wait for a PSP / very clear SSMT before entering a trade.</span>
          </div>

        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}