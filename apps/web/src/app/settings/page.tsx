"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface SubscriptionData {
  user: { id: number; name: string | null; email: string | null; tier: string | null };
  activeSubscription: {
    tier: string;
    startDate: string;
    endDate: string;
    status: string;
    midtransId: string | null;
  } | null;
  subscriptions: Array<{
    tier: string;
    startDate: string;
    endDate: string;
    status: string;
    midtransId: string | null;
  }>;
}

function formatDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
}

function daysLeft(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  useEffect(() => {
    if (status === "loading" || !session?.user) return;
    fetch("/api/settings/subscription")
      .then((r) => r.json())
      .then((d) => {
        setData(d.data);
        setName(d.data?.user?.name || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, session]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (res.ok) {
        setProfileMsg("Tersimpan");
      } else {
        setProfileMsg(d.error || "Gagal menyimpan");
      }
    } catch {
      setProfileMsg("Gagal menyimpan");
    }
    setSavingProfile(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-1/3" />
          <div className="h-32 bg-white/5 rounded" />
          <div className="h-32 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-white/60 mb-4">Silakan masuk untuk mengakses pengaturan</p>
        <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
          Masuk
        </Link>
      </div>
    );
  }

  const active = data?.activeSubscription;
  const tier = data?.user?.tier || "free";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Profil</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 font-medium block mb-1">Email</label>
            <input
              type="email"
              value={session.user.email || ""}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/40"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 font-medium block mb-1">Nama</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama tampilan"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-medium rounded-lg px-5 py-2.5 text-sm transition-colors whitespace-nowrap"
              >
                {savingProfile ? "..." : "Simpan"}
              </button>
            </div>
            {profileMsg && <p className="text-xs text-white/50 mt-1">{profileMsg}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Langganan</h2>
          <span
            className={`text-xs px-2.5 py-1 rounded-full border ${
              tier === "pro"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-white/5 text-white/50 border-white/10"
            }`}
          >
            {tier === "pro" ? "PRO" : "FREE"}
          </span>
        </div>

        {active ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Status</span>
              <span className="text-emerald-400 capitalize">{active.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Mulai</span>
              <span>{formatDate(active.startDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Berakhir</span>
              <span>{formatDate(active.endDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Sisa waktu</span>
              <span className="font-medium">{daysLeft(active.endDate)} hari</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-white/60">Anda belum memiliki langganan aktif.</p>
            <Link
              href="/subscription"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg px-5 py-2.5 text-sm transition-colors"
            >
              Upgrade ke PRO
            </Link>
          </div>
        )}
      </section>

      {data?.subscriptions && data.subscriptions.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Riwayat Transaksi</h2>
          <div className="space-y-2">
            {data.subscriptions.map((sub, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                <div>
                  <span className="font-medium uppercase">{sub.tier}</span>
                  <span className="text-white/40 ml-2">{formatDate(sub.startDate)}</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    sub.status === "active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : sub.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-white/5 text-white/40"
                  }`}
                >
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="pt-2">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm text-red-400/70 hover:text-red-400 transition-colors"
        >
          Keluar dari akun
        </button>
      </section>
    </div>
  );
}
