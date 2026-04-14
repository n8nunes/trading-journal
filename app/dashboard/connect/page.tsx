"use client";
import { useState } from "react";

export default function ConnectMatchTrader() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData);

    // Send credentials to your secure API route
    const res = await fetch("/api/match-trader/connect", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Account connected! Syncing backlog...");
      // Trigger initial sync here
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleConnect} className="max-w-md mx-auto mt-10 space-y-4 p-6 border rounded-lg">
      <h2 className="text-xl font-bold text-white">Connect Match-Trader</h2>
      
      <div>
        <label className="block text-sm text-gray-400">Broker API URL</label>
        <input name="brokerUrl" type="url" required placeholder="e.g., https://api.match-trader.com" className="w-full p-2 rounded bg-gray-800 text-white" />
      </div>
      
      <div>
        <label className="block text-sm text-gray-400">Account ID</label>
        <input name="accountId" type="text" required className="w-full p-2 rounded bg-gray-800 text-white" />
      </div>
      
      <div>
        <label className="block text-sm text-gray-400">Investor Password</label>
        <input name="password" type="password" required className="w-full p-2 rounded bg-gray-800 text-white" />
      </div>

      <button disabled={loading} type="submit" className="w-full bg-blue-600 p-2 rounded text-white hover:bg-blue-700">
        {loading ? "Connecting..." : "Connect & Sync"}
      </button>
    </form>
  );
}