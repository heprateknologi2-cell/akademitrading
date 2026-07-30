"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

const PLANS = [
  { id: "free", name: "Free", price: 0, period: "", features: ["Screener dasar", "Sinyal H-3", "Watchlist 5 saham"], popular: false },
  { id: "pro_monthly", name: "PRO", price: 75000, period: "/bulan", features: ["Semua filter screener", "Signal harian + notif Telegram", "Watchlist unlimited", "Backtest 1 tahun", "Price alert"], popular: true },
  { id: "pro_yearly", name: "PRO Tahunan", price: 750000, period: "/tahun", features: ["Semua fitur PRO", "Hemat 2 bulan", "Prioritas support"], popular: false },
];

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return;
    setLoading(planId);
    setError("");

    try {
      const res = await fetch("/api/midtrans/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setError("Gagal memproses pembayaran");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    }
    setLoading(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Pilih Paket</h1>
        <p className="text-white/60">Akses penuh screener & sinyal trading saham Indonesia</p>
      </div>

      {error && <div className="text-center text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`rounded-xl border ${plan.popular ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 bg-white/5"} p-6 space-y-4 relative`}>
            {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">POPULER</div>}
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <div>
                <span className="text-3xl font-bold">{plan.price === 0 ? "Gratis" : `Rp${plan.price.toLocaleString()}`}</span>
                <span className="text-sm text-white/40">{plan.period}</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-white/70">
              {plan.features.map((f) => <li key={f} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {f}
              </li>)}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading === plan.id || plan.price === 0}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${
                plan.popular
                  ? "bg-emerald-500 hover:bg-emerald-600 text-black disabled:opacity-50"
                  : "bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30"
              }`}
            >
              {loading === plan.id ? "Memproses..." : plan.price === 0 ? "Aktif" : "Langganan"}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-white/30">
        Pembayaran diproses oleh Midtrans. Data aman & terenkripsi.
      </p>
    </div>
  );
}
