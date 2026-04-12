"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage, ADMIN_UID } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminDashboard() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    asset: "EURUSD",
    marketNarrative: "",
    confluences: "",
    outcome: "",
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user || user.uid !== ADMIN_UID) router.push("/login");
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let chart_url = "";
      if (file) {
        const sRef = ref(storage, `charts/${Date.now()}-${file.name}`);
        const snap = await uploadBytes(sRef, file);
        chart_url = await getDownloadURL(snap.ref);
      }

      await addDoc(collection(db, "journal_entries"), {
        date: serverTimestamp(),
        asset: formData.asset,
        context: { market_narrative: formData.marketNarrative },
        technical_execution: { confluences: formData.confluences },
        media: { chart_url },
        review: { is_published: true, outcome: formData.outcome }
      });
      alert("Trade Logged.");
      router.push("/");
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white p-10 font-mono">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl border-b border-slate-800 pb-4">NEW_ENTRY_LOG</h1>
        <input className="w-full bg-zinc-900 p-3 rounded" placeholder="Asset (e.g. NQ)" onChange={e => setFormData({...formData, asset: e.target.value})} />
        <textarea className="w-full bg-zinc-900 p-3 h-32 rounded" placeholder="AMD Cycle Narrative..." onChange={e => setFormData({...formData, marketNarrative: e.target.value})} />
        <textarea className="w-full bg-zinc-900 p-3 h-32 rounded" placeholder="Confluences (iFVG, SMT, Liquidity)..." onChange={e => setFormData({...formData, confluences: e.target.value})} />
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:bg-blue-600 file:text-white file:border-0" />
        <button disabled={loading} className="w-full bg-blue-600 p-4 font-bold hover:bg-blue-500">{loading ? "SYNCING..." : "COMMIT TO DATABASE"}</button>
      </form>
    </div>
  );
}