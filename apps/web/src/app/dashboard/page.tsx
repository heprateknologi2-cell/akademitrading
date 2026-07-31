"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchWatchlist, fetchMarketOverview, type WatchlistItem, type MarketOverview } from "@/lib/api";
import { formatPrice, formatPercent, formatVolume } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [market, setMarket] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading" || !session?.user) return;
    let active = true;
    const load = () => {
      Promise.all([
        fetchWatchlist().then(res => res.data || []).catch(() => []),
        fetchMarketOverview().then(res => res.data || null).catch(() => null),
      ]).then(([wl, mv]) => {
        if (!active) return;
        setWatchlist(wl);
        setMarket(mv);
        setLoading(false);
      });
    };
    load();
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    const timer = setInterval(() => { if (document.visibilityState === "visible") load(); }, 60000);
    document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [session, status]);

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
        {loading ? (
          <>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {market && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs text-white/40 uppercase tracking-wider">IHSG</div>
            <div className="flex items-baseline gap-3 mt-1">
              <div className="text-xl font-bold font-mono text-white">{formatPrice(market.ihsg.price)}</div>
              <div className={`text-sm font-mono ${market.ihsg.change_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatPercent(market.ihsg.change_percent)}
              </div>
            </div>
            <div className="text-xs text-white/40 mt-1">Volume: {formatVolume(market.ihsg.volume)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs text-white/40 uppercase tracking-wider">Market Breadth</div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">{market.breadth.advancers}</div>
                <div className="text-[11px] text-white/40">Naik</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-400">{market.breadth.decliners}</div>
                <div className="text-[11px] text-white/40">Turun</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white/60">{market.breadth.unchanged}</div>
                <div className="text-[11px] text-white/40">Stagnan</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs text-white/40 uppercase tracking-wider">Tercatat</div>
            <div className="text-lg font-bold mt-1 text-white">{market.breadth.total} saham</div>
            <div className="text-xs text-white/40 mt-1">
              Rasio naik/turun: <span className={market.breadth.advancers >= market.breadth.decliners ? "text-emerald-400" : "text-red-400"}>
                {(market.breadth.advancers / Math.max(market.breadth.decliners, 1)).toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {market && market.top_gainers.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-semibold">Top Gainers</h2>
              <Link href="/screener?sort_by=change_percent&sort_order=desc" className="text-xs text-emerald-400 hover:text-emerald-300">Screener</Link>
            </div>
            <div className="divide-y divide-white/5">
              {market.top_gainers.slice(0, 5).map((s) => (
                <Link key={s.code} href={`/stocks/${s.code}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
                  <div className="font-medium text-sm">{s.code}</div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{formatPrice(s.price)}</div>
                    <div className="text-xs font-mono text-emerald-400">{formatPercent(s.change_percent)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {market && market.top_losers.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-semibold">Top Losers</h2>
              <Link href="/screener?sort_by=change_percent&sort_order=asc" className="text-xs text-emerald-400 hover:text-emerald-300">Screener</Link>
            </div>
            <div className="divide-y divide-white/5">
              {market.top_losers.slice(0, 5).map((s) => (
                <Link key={s.code} href={`/stocks/${s.code}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
                  <div className="font-medium text-sm">{s.code}</div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{formatPrice(s.price)}</div>
                    <div className="text-xs font-mono text-red-400">{formatPercent(s.change_percent)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Watchlist Saya</h2>
          <Link href="/screener" className="text-xs text-emerald-400 hover:text-emerald-300">+ Tambah Saham</Link>
        </div>
        {loading ? (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="divide-y divide-white/5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 px-5">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-14 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{item.code}</div>
                    <div className="text-xs text-white/40">{item.name}</div>
                  </div>
                  {item.alert_price && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        item.alert_status === "below"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                      title={item.alert_status === "below" ? `Harga ${formatPrice(item.price ?? 0)} di bawah alert` : `Harga di atas alert`}
                    >
                      {item.alert_status === "below" ? "▲ Alert Terpenuhi" : "● Alert Aktif"}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{item.price ? `Rp${item.price.toLocaleString()}` : "-"}</div>
                  <div className={`text-xs font-mono ${item.change_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(item.change_percent)}
                  </div>
                  {item.alert_price && <div className="text-xs text-white/40">Alert: Rp{item.alert_price.toLocaleString()}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
