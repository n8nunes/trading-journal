"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, ADMIN_UID } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function AccessSettings() {
  const router = useRouter();
  const [visibility, setVisibility] = useState<"public" | "private" | "invite-only">("private");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  // Auth Guard & Fetch Existing Settings
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user || user.uid !== ADMIN_UID) {
        router.push("/login");
      } else {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.visibility) setVisibility(data.visibility);
            if (data.invitedEmails) setInvitedEmails(data.invitedEmails);
          }
        } catch (error) {
          console.error("Failed to fetch settings:", error);
        }
      }
    });
    return () => unsub();
  }, [router]);

  // Save Settings to Database
  // Save Settings to Database
  const saveAccessSettings = async (newVis: string, emails: string[]) => {
    if (!auth.currentUser) return;
    setIsSavingAccess(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), { 
        visibility: newVis,
        invitedEmails: emails,
        traderEmail: auth.currentUser.email
      }, { merge: true });
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("ERROR: Failed to save privacy settings.");
    } finally {
      setIsSavingAccess(false);
    }
  };

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVis = e.target.value as "public" | "private" | "invite-only";
    setVisibility(newVis);
    saveAccessSettings(newVis, invitedEmails);
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail && !invitedEmails.includes(newEmail.toLowerCase())) {
      const updatedList = [...invitedEmails, newEmail.toLowerCase()];
      setInvitedEmails(updatedList);
      saveAccessSettings(visibility, updatedList);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const updatedList = invitedEmails.filter(email => email !== emailToRemove);
    setInvitedEmails(updatedList);
    saveAccessSettings(visibility, updatedList);
  };

  return (
    <div className="min-h-screen bg-beige-retro text-brown-dark p-6 md:p-12 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Header */}
        <header className="border-b-4 border-brown-dark pb-4 flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tighter uppercase">nfx // Access_Control</h1>
          </div>
          <button 
            type="button" onClick={() => router.push("/")} 
            className="text-[10px] font-black bg-beige-retro text-brown-dark px-3 py-1 uppercase border-2 border-brown-dark hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-colors"
          >
            {"< RETURN_TO_FEED"}
          </button>
        </header>

        {/* Settings Panel */}
        <div className="border-2 border-brown-dark bg-beige-muted p-8 shadow-[8px_8px_0px_0px_rgba(74,55,33,1)]">
          <div className="flex justify-between items-center mb-8 border-b-2 border-brown-dark pb-4">
            <h2 className="text-xl font-black uppercase tracking-widest">// Journal_Visibility_Settings</h2>
            {isSavingAccess && <span className="text-xs font-black uppercase bg-brown-dark text-beige-retro px-2 py-1 animate-pulse">SYNCING...</span>}
          </div>
          
          <div className="flex flex-col gap-8">
            {/* Global Access Level */}
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-brown-medium">Global_Access_Level</label>
              <select 
                value={visibility}
                onChange={handleVisibilityChange}
                className="w-full bg-beige-retro border-2 border-brown-dark p-4 text-sm font-black uppercase outline-none focus:bg-white cursor-pointer transition-colors"
              >
                <option value="private">PRIVATE (Only You)</option>
                <option value="public">PUBLIC (Anyone can view)</option>
                <option value="invite-only">INVITE ONLY (Whitelisted Google Accounts)</option>
              </select>
              
              <div className="bg-beige-retro p-4 border border-brown-light text-xs leading-relaxed font-mono mt-4">
                <span className="block text-brown-medium font-black mb-2 uppercase tracking-[0.2em]">// Status_Message</span>
                {visibility === "public" && "WARNING: Your journal feed is visible to anyone."}
                {visibility === "private" && "SECURE: Only you can access your journal records."}
                {visibility === "invite-only" && "RESTRICTED: Only verified emails below can access."}
              </div>
            </div>

            {/* Email Whitelist */}
            {visibility === "invite-only" && (
              <div className="border-t-4 border-dashed border-brown-light pt-8 space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-brown-medium">Authorized_Viewer_Emails</label>
                <form onSubmit={handleAddEmail} className="flex gap-2">
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="add_google_email@gmail.com"
                    className="w-full bg-beige-retro border-2 border-brown-dark p-3 text-sm font-bold outline-none focus:bg-white"
                  />
                  <button 
                    type="submit"
                    className="bg-brown-dark text-beige-retro px-6 py-3 border-2 border-brown-dark text-sm font-black hover:bg-brown-medium cursor-pointer transition-colors"
                  >
                    AUTHORIZE
                  </button>
                </form>
                
                <div className="bg-beige-retro border-2 border-brown-dark min-h-[150px] p-4 max-h-[300px] overflow-y-auto">
                  {invitedEmails.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-brown-medium/50 uppercase font-black">
                      NO_ACCOUNTS_AUTHORIZED
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {invitedEmails.map(email => (
                        <div key={email} className="flex justify-between items-center border-2 border-brown-dark bg-beige-muted p-3">
                          <span className="text-xs font-black uppercase">{email}</span>
                          <button 
                            type="button" onClick={() => handleRemoveEmail(email)}
                            className="text-red-800 text-[10px] bg-beige-retro px-3 py-1 border-2 border-red-800 font-black hover:bg-red-800 hover:text-beige-retro transition-colors cursor-pointer"
                          >
                            [REVOKE]
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}