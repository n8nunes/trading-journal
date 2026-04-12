"use client";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push("/admin");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 font-mono">
      <button onClick={handleLogin} className="bg-white text-black px-8 py-4 rounded-full font-bold">ACCESS TERMINAL</button>
    </div>
  );
}