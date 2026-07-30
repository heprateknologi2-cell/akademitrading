"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("email", { email, redirect: false });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Masuk</h1>
          <p className="text-sm text-white/60">Akses screener premium & sinyal eksklusif</p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-400">
            Cek email {email} untuk link masuk
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Masukkan email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg px-4 py-3 text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Mengirim..." : "Kirim Magic Link"}
            </button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
          <div className="relative flex justify-center text-xs text-white/30"><span className="bg-[#020817] px-2">atau</span></div>
        </div>

        {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-sm transition-colors"
          >
            Lanjut dengan Google
          </button>
        )}
      </div>
    </div>
  );
}
