import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { daily_bias, trades, summary_card_url } = await req.json();

    const totalPL = trades.reduce((sum: number, t: any) => sum + (Number(t.pl) || 0), 0) || 0;
    const plSign = totalPL >= 0 ? '+' : '';

    // Construct the Discord Payload
    const discordPayload = {
      username: "nfx // TERMINAL",
      avatar_url: "https://your-vercel-domain.com/favicon.ico", 
      embeds: [{
        title: `📟 SESSION_LOG // ${new Date().toLocaleDateString('en-GB')}`,
        color: 4863777, // #4A3721 in decimal (your signature brown)
        fields: [
          { name: "DAILY BIAS", value: `\`${daily_bias.toUpperCase()}\``, inline: false },
          { 
            name: "EXECUTIONS", 
            value: trades.map((t: any) => `**${t.pair}**: ${t.pl >= 0 ? '+' : ''}${t.pl}%`).join('\n'), 
            inline: true 
          },
          { 
            name: "NET RESULT", 
            value: `**${plSign}${totalPL}%**`, 
            inline: true 
          }
        ],
        image: { url: summary_card_url }, 
        footer: { text: "nfx_mechanical_systems_v1.0" },
        timestamp: new Date().toISOString()
      }]
    };

    const response = await fetch(process.env.DISCORD_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) throw new Error('Discord rejected the payload');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DISCORD_SYNC_ERROR:', error);
    return NextResponse.json({ error: 'Discord Sync Failed' }, { status: 500 });
  }
}