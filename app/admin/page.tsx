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
    asset: "NQ",
    marketNarrative: "",
    confluences: "",
    outcome: "",
  });

  // Client-Side Auth Guard
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.error("No user detected, redirecting...");
        router.push("/login");
      } else if (user.uid !== ADMIN_UID) {
        console.error("ACCESS DENIED: UID mismatch.");
        alert("You do not have administrative privileges.");
        router.push("/"); // Kick to public feed
      } else {
        console.log("Terminal Access Granted.");
      }
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("--- SYNC START ---");

    try {
      if (!auth.currentUser) throw new Error("Authentication failure.");

      let chart_url = "";
      // Image Upload
      if (file) {
        console.log("Attempting Image Upload...");
        const sRef = ref(storage, `charts/${Date.now()}-${file.name}`);
        const snap = await uploadBytes(sRef, file);
        chart_url = await getDownloadURL(snap.ref);
        console.log("Image Upload Success:", chart_url);
      }

      // Firestore Write
      console.log("Attempting Firestore Write...");
      const docData = {
        date: serverTimestamp(),
        asset: formData.asset || "NQ",
        context: { market_narrative: formData.marketNarrative || "No narrative" },
        technical_execution: { confluences: formData.confluences || "No confluences" },
        media: { chart_url },
        review: { is_published: true, outcome: formData.outcome || "Pending" }
      };
      
      const docRef = await addDoc(collection(db, "journal_entries"), docData);
      console.log("FIRESTORE SUCCESS! ID:", docRef.id);
      alert("Post Synced Successfully!");
      router.push("/");
    } catch (err: any) {
      console.error("Sync Error Details:", err.code, err.message);
      alert(`Sync Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige-retro text-brown-dark p-10 font-mono">
      <div className="max-w-3xl mx-auto">
        <header className="border-b-2 border-brown-medium pb-4 mb-8 flex justify-between items-end">
          <h1 className="text-xl font-black text-brown-dark uppercase tracking-tighter">New_Log_Terminal</h1>
          <p className="text-xs text-brown-medium uppercase">[AUTHENTICATED_SESSION]</p>
        </header>

        <form onSubmit={handleSubmit} className="p-8 border-2 border-brown-dark bg-beige-muted shadow-2xl space-y-6">
          <input className="w-full bg-beige-retro p-3 border border-brown-light focus:ring-2 focus:ring-brown-medium rounded" placeholder="Asset (e.g. NQ)" onChange={e => setFormData({...formData, asset: e.target.value.toUpperCase()})} />
          <textarea className="w-full bg-beige-retro p-3 h-32 border border-brown-light focus:ring-2 focus:ring-brown-medium rounded" placeholder="Market Narrative (AMD Cycle context)..." onChange={e => setFormData({...formData, marketNarrative: e.target.value})} />
          <textarea className="w-full bg-beige-retro p-3 h-32 border border-brown-light focus:ring-2 focus:ring-brown-medium rounded" placeholder="Technical Confluences (iFVG, SMT, Liquidity sweeps)..." onChange={e => setFormData({...formData, confluences: e.target.value})} />
          
          <div className="border border-brown-light bg-beige-retro p-4 rounded flex items-center justify-between">
            <label className="text-sm font-bold text-brown-dark">// Upload Chart Screenshot</label>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="block text-sm text-brown-medium file:mr-4 file:py-2 file:px-4 file:bg-brown-medium file:text-brown-medium file:border-0 file:rounded file:hover:bg-brown-dark cursor-pointer" />
          </div>
          
          <button disabled={loading} className="w-full bg-brown-dark p-4 font-bold text-brown-medium uppercase hover:bg-brown-medium transition-colors disabled:opacity-50">
            {loading ? "SYNCING..." : "COMMIT TO DATABASE"}
          </button>
        </form>
      </div>
    </div>
  );
}