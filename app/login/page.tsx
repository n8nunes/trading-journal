"use client";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [targetTraderId, setTargetTraderId] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/"); 
      } else {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Unified Google Login
  const handleLogin = async (redirectRoute: string) => {
    if (isLoggingIn) return; 
    setIsLoggingIn(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      
      // If authenticating to view a specific trader, route there. Otherwise, route to own dashboard.
      router.push(redirectRoute);
    } catch (e: any) {
      if (e.code !== 'auth/cancelled-popup-request') {
        console.error("error.", e);
      }
      setIsLoggingIn(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige-retro font-mono">
        <p className="text-brown-dark font-black tracking-widest uppercase animate-pulse">ESTABLISHING_CONNECTION...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-beige-retro font-mono">
      
      {/* LEFT SIDE - TRADERS */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 border-b-4 md:border-b-0 md:border-r-4 border-brown-dark bg-beige-muted">
        <div className="text-center w-full max-w-md p-8 border-2 border-brown-dark shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] bg-beige-retro">
          <h1 className="text-3xl font-black text-brown-dark mb-4 tracking-tighter uppercase">Trader_Terminal</h1>
          <p className="text-xs text-brown-medium mb-10 font-bold uppercase tracking-widest border-b-2 border-brown-medium pb-4">
            // Manage Your Journal
          </p>
          
          <button 
            onClick={() => handleLogin("/")} 
            disabled={isLoggingIn}
            className={`w-full bg-brown-dark border border-brown cursor-pointer text-beige-retro px-6 py-5 font-bold uppercase hover:bg-brown-medium transition-all ${isLoggingIn ? 'opacity-50' : 'opacity-100'}`}
          >
            {isLoggingIn ? "AUTHENTICATING..." : "LOGIN_WITH_GOOGLE"}
          </button>
        </div>
      </div>

      {/* RIGHT SIDE - VIEWERS */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 bg-beige-retro">
        <div className="text-center w-full max-w-md p-8 border-2 border-brown-dark shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] bg-beige-muted">
          <h1 className="text-3xl font-black text-brown-dark mb-4 tracking-tighter uppercase">Viewer_Access</h1>
          <p className="text-xs text-brown-medium mb-10 font-bold uppercase tracking-widest border-b-2 border-brown-medium pb-4">
            // Access a Shared Journal
          </p>
          
          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              value={targetTraderId}
              onChange={(e) => setTargetTraderId(e.target.value)}
              placeholder="ENTER_TRADER_ID" 
              className="w-full bg-transparent border-2 border-brown-dark p-4 text-brown-dark font-black uppercase placeholder:text-brown-medium/50 focus:outline-none focus:ring-2 focus:ring-brown-dark focus:bg-beige-retro transition-colors"
            />
            <button 
              onClick={() => {
                if (!targetTraderId) alert("Please enter a Trader ID first.");
                else handleLogin(`/view/${targetTraderId}`);
              }}
              disabled={isLoggingIn}
              className="w-full bg-transparent border-2 border-brown-dark text-brown-dark px-6 py-5 font-black uppercase hover:bg-brown-dark hover:text-beige-retro transition-all cursor-pointer"
            >
              VERIFY_GOOGLE_ID_&_VIEW
            </button>
          </div>
          
          <p className="mt-6 text-[10px] font-black uppercase text-brown-medium">
            // Required for invite-only access
          </p>
        </div>
      </div>

    </div>
  );
}