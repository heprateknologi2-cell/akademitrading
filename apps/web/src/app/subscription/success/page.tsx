"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/dashboard"), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Pembayaran Berhasil!</h1>
        <p className="text-white/60">Selamat! Akun PRO kamu sudah aktif. Nikmati semua fitur premium.</p>
        <div className="pt-4 space-y-2">
          <Link href="/dashboard" className="block w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg px-4 py-3 text-sm">
            Buka Dashboard
          </Link>
          <Link href="/screener" className="block w-full text-sm text-white/40 hover:text-white/60">
            Lanjut ke Screener
          </Link>
        </div>
      </div>
    </div>
  );
}
