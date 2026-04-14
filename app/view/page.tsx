"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthorizedTrader {
  id: string;
  traderEmail: string;
}

export default function ViewerDashboard() {
  const router = useRouter();
  const [traders, setTraders] = useState<AuthorizedTrader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthorizedJournals = async (email: string) => {
      try {
        // Query the 'users' collection to find any trader who has this email in their invitedEmails array
        const q = query(
          collection(db, "users"), 
          where("invitedEmails", "array-contains", email.toLowerCase())
        );
        
        const snapshot = await getDocs(q);
        const authorizedList = snapshot.docs.map(doc => ({
          id: doc.id,
          traderEmail: doc.data().traderEmail || "Unknown_Trader_ID",
        }));
        
        setTraders(authorizedList);
      } catch (error) {
        console.error("Failed to fetch journals", error);
      } finally {
        setIsLoading(false);
      }
    };

    const unsub = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        fetchAuthorizedJournals(user.email);
      } else {
        router.push("/login");
      }
    });

    return () => unsub();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige-retro font-mono">
        <div className="text-center p-8 border-2 border-brown-dark shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] bg-beige-muted">
          <p className="text-brown-dark font-black tracking-widest uppercase animate-pulse">
            // SCANNING_ACCESS_RECORDS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-retro text-brown-dark p-6 md:p-12 font-mono flex items-center justify-center">
      <div className="w-full max-w-2xl border-2 border-brown-dark bg-beige-muted p-8 shadow-[8px_8px_0px_0px_rgba(74,55,33,1)]">
        
        <header className="border-b-2 border-brown-dark pb-4 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Viewer_Hub</h1>
            <p className="text-[10px] font-black uppercase text-brown-medium mt-1">
              AUTHORIZED_AS: {userEmail}
            </p>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="text-[10px] font-black uppercase border border-brown-dark px-2 py-1 hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-colors"
          >
            DISCONNECT
          </button>
        </header>

        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-brown-medium">// Authorized_Journals</h2>
          
          {traders.length === 0 ? (
            <div className="border-2 border-dashed border-brown-light p-12 text-center bg-beige-retro">
              <p className="text-brown-medium font-black uppercase tracking-[0.1em] text-sm">
                NO_ACCESS_GRANTED
              </p>
              <p className="text-[10px] uppercase font-bold text-brown-medium mt-2">
                Your email has not been whitelisted by any traders.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {traders.map((trader) => (
                <button
                  key={trader.id}
                  onClick={() => router.push(`/view/${trader.id}`)}
                  className="flex items-center justify-between p-6 border-2 border-brown-dark bg-beige-retro hover:bg-brown-dark hover:text-beige-retro transition-colors cursor-pointer group text-left"
                >
                  <div>
                    <span className="block text-lg font-black uppercase tracking-tight group-hover:text-beige-retro">
                      {trader.traderEmail}'s Journal
                    </span>
                    <span className="text-[10px] font-black uppercase text-brown-medium group-hover:text-brown-light mt-1 block">
                      ID: {trader.id}
                    </span>
                  </div>
                  <span className="text-xl font-black group-hover:translate-x-2 transition-transform">
                    {">"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual Fallback for Public Journals */}
        <div className="mt-12 pt-8 border-t-2 border-dashed border-brown-light">
           <form 
             onSubmit={(e) => {
               e.preventDefault();
               const formData = new FormData(e.currentTarget);
               const publicId = formData.get("publicId");
               if (publicId) router.push(`/view/${publicId}`);
             }}
             className="flex flex-col gap-2"
           >
             <label className="text-[10px] font-black uppercase tracking-widest text-brown-medium">Access_Public_Journal_By_ID</label>
             <div className="flex gap-2">
               <input 
                 name="publicId"
                 type="text" 
                 placeholder="ENTER_TRADER_ID"
                 className="flex-grow bg-beige-retro border border-brown-dark p-2 text-xs font-bold outline-none uppercase"
               />
               <button 
                 type="submit"
                 className="bg-brown-dark text-beige-retro px-4 py-2 text-xs font-black hover:bg-brown-medium cursor-pointer"
               >
                 VIEW
               </button>
             </div>
           </form>
        </div>

      </div>
    </div>
  );
}