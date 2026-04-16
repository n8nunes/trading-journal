"use client";

import { useState, useEffect } from "react";
import { auth, ADMIN_UID } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAttempting, setIsAttempting] = useState(false);

  // Listen for auth state changes to route users automatically
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        // Route based on Admin UID match
        if (user.uid === ADMIN_UID) {
          router.push("/dashboard");
        } else {
          router.push("/view");
        }
      } else {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleGoogleLogin = async () => {
    if (isAttempting) return;
    setIsAttempting(true);
    setError("");
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // We don't need a router.push() here because the onAuthStateChanged 
      // listener above will detect the login and route them perfectly.
    } catch (err: any) {
      console.error("Login error:", err);
      setError("AUTHENTICATION_FAILED: " + (err.message || "Unknown Error"));
      setIsAttempting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige-retro font-mono">
        <div className="text-center p-8 border-2 border-brown-dark shadow-[8px_8px_0px_0px_rgba(74,55,33,1)] bg-beige-muted">
          <p className="text-brown-dark font-black tracking-widest uppercase animate-pulse">
            // AUTHENTICATING_SESSION...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-retro flex flex-col items-center justify-center p-6 font-mono text-brown-dark animate-fade-in-up">
      
      {/* Global Error Display */}
      {error && (
        <div className="mb-6 w-full max-w-4xl p-4 border-2 border-red-800 bg-red-100/40 text-red-800 text-sm font-black uppercase tracking-widest text-center shadow-[4px_4px_0px_0px_rgba(153,27,27,1)]">
          {error}
        </div>
      )}

      {/* Split Login Container */}
      <div className="w-full max-w-5xl border-4 border-brown-dark flex flex-col md:flex-row shadow-[12px_12px_0px_0px_rgba(74,55,33,1)]">
        
        {/* Trader Side (Left / Top) */}
        <div className="flex-1 p-10 md:p-16 bg-brown-dark text-beige-retro border-b-4 md:border-b-0 md:border-r-4 border-brown-dark flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">TRADER_LOGIN</h2>
          <p className="text-xs font-black uppercase tracking-widest text-brown-medium mb-12">
            // ADMIN_ACCESS_ONLY
          </p>
          
          <button
            onClick={handleGoogleLogin}
            disabled={isAttempting}
            className="w-full max-w-xs bg-beige-retro text-brown-dark border-2 border-brown-dark p-4 text-sm font-black uppercase tracking-widest cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(180,165,145,1)] hover:bg-brown-medium hover:border-brown-medium hover:text-beige-retro active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isAttempting ? "[ PROCESSING... ]" : "[ GOOGLE_AUTH ]"}
          </button>
        </div>

        {/* Viewer Side (Right / Bottom) */}
        <div className="flex-1 p-10 md:p-16 bg-beige-muted text-brown-dark flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">VIEWER_LOGIN</h2>
          <p className="text-xs font-black uppercase tracking-widest text-brown-medium mb-12">
            // GUESTS_&_PUBLIC_ACCESS
          </p>
          
          <button
            onClick={handleGoogleLogin}
            disabled={isAttempting}
            className="w-full max-w-xs bg-brown-dark text-beige-retro border-2 border-brown-dark p-4 text-sm font-black uppercase tracking-widest cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] hover:bg-brown-medium active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isAttempting ? "[ PROCESSING... ]" : "[ GOOGLE_AUTH ]"}
          </button>
        </div>

      </div>
    </div>
  );
}