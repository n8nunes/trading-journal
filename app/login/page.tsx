"use client";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return; // Prevent double-firing
    setIsLoggingIn(true);

    try {
      const provider = new GoogleAuthProvider();
      // Force account selection to avoid Uni/Personal mix-ups
      provider.setCustomParameters({ prompt: 'select_account' });
      
      await signInWithPopup(auth, provider);
      router.push("/admin");
    } catch (e: any) {
      if (e.code === 'auth/popup-blocked') {
        alert("popup_blocked // please allow popups for localhost:3000.");
      } else if (e.code === 'auth/cancelled-popup-request') {
        console.log("cancelled.");
      } else {
        console.error("error.", e);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-beige-retro font-mono">
      <div className="text-center p-12 border-2 border-brown-dark shadow-2xl bg-beige-muted">
        <h1 className="text-3xl font-black text-brown-dark mb-10 tracking-tighter uppercase border-b-2 border-brown-medium pb-4">Log_In_Terminal</h1>
        <button 
          onClick={handleLogin} 
          disabled={isLoggingIn}
          className={`bg-brown-dark text-brown-medium px-10 py-5 font-bold uppercase hover:bg-brown-medium transition-all ${isLoggingIn ? 'opacity-50' : 'opacity-100'}`}
        >
          {isLoggingIn ? "ESTABLISHING CONNECTION..." : "ACCESS_TERMINAL"}
        </button>
        {isLoggingIn && (
          <p className="mt-4 text-xs text-brown-medium">// Authenticating via Google...</p>
        )}
      </div>
    </div>
  );
}