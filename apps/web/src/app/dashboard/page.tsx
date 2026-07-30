"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchWatchlist, type WatchlistItem } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    fetchWatchlist().then(res => {
      setWatchlist(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [session]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-white/60">Selamat datang, {session?.user?.name || session?.user?.email}</p>
        </div>
        <Link href="/subscription" className="text-sm bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
          {session?.user?.tier === "free" ? "Upgrade ke PRO" : "PRO Active"}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-white/40 uppercase tracking-wider">Tier</div>
          <div className={`text-lg font-bold mt-1 ${session?.user?.tier === "pro" ? "text-emerald-400" : "text-white/60"}`}>
            {session?.user?.tier === "pro" ? "PRO" : "Free"}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-white/40 uppercase tracking-wider">Email</div>
          <div className="text-sm font-mono mt-1 text-white/80">{session?.user?.email}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-white/40 uppercase tracking-wider">Watchlist</div>
          <div className="text-lg font-bold mt-1 text-cyan-400">{watchlist.length} saham</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Watchlist Saya</h2>
          <Link href="/screener" className="text-xs text-emerald-400 hover:text-emerald-300">+ Tambah Saham</Link>
        </div>
        {loading ? (
          <div className="text-center py-8 text-white/40">Loading...</div>
        ) : watchlist.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <p>Belum ada saham di watchlist</p>
            <Link href="/screener" className="text-emerald-400 text-sm mt-2 inline-block hover:text-emerald-300">
              Cari saham di screener &rarr;
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {watchlist.map((item) => (
              <Link key={item.code} href={`/stocks/${item.code}`} className="flex items-center justify-between py-3 hover:bg-white/5 -mx-5 px-5 transition-colors">
                <div>
                  <div className="font-medium">{item.code}</div>
                  <div className="text-xs text-white/40">{item.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{item.price ? `Rp${item.price.toLocaleString()}` : "-"}</div>
                  {item.alert_price && <div className="text-xs text-amber-400">Alert: Rp{item.alert_price.toLocaleString()}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
