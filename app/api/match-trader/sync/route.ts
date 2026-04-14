import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; // Ensure your firebase admin/client is initialized here
import { decrypt } from '@/lib/encryption';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    // In a real scenario, get the user ID from your auth session
    const { userId, brokerUrl, accountId, encryptedPassword } = await req.json();
    const password = decrypt(encryptedPassword);

    // 1. Authenticate with Match-Trader to get a session token
    const authRes = await fetch(`${brokerUrl}/api/v1/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: accountId, password: password }),
    });
    const authData = await authRes.json();
    const token = authData.token;

    // 2. Fetch closed trades (History)
    const historyRes = await fetch(`${brokerUrl}/api/v1/trading/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const historyData = await historyRes.json();

    const tradesRef = collection(db, 'trades');
    let addedCount = 0;

    // 3. Process and push to Firebase as "Backlog"
    for (const trade of historyData.trades) {
      // Check if trade already exists to avoid duplicates
      const q = query(tradesRef, where("platformTradeId", "==", trade.id));
      const existing = await getDocs(q);

      if (existing.empty) {
        await addDoc(tradesRef, {
          userId: userId,
          platformTradeId: trade.id,
          symbol: trade.symbol,
          openPrice: trade.openPrice,
          closePrice: trade.closePrice,
          stopLoss: trade.sl, 
          takeProfit: trade.tp,
          volume: trade.volume,
          profit: trade.profit,
          openTime: trade.openTime,
          closeTime: trade.closeTime,
          status: "backlog", // <--- THE MOST IMPORTANT PART
          createdAt: new Date().toISOString(),
        });
        addedCount++;
      }
    }

    return NextResponse.json({ success: true, addedToBacklog: addedCount });

  } catch (error) {
    console.error("Match-Trader Sync Error:", error);
    return NextResponse.json({ error: "Failed to sync trades" }, { status: 500 });
  }
}