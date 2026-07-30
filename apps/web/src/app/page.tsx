"use client";

import { useEffect, useState } from "react";
import { fetchScreener, fetchSignals, type StockItem, type SignalItem } from "@/lib/api";
import { formatPrice, formatPercent, formatVolume, signalColor, signalLabel } from "@/lib/utils";
import Link from "next/link";

export default function Dashboard() {
  const [topMovers, setTopMovers] = useState<StockItem[]>([]);
  const [topSignals, setTopSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [screener, signals] = await Promise.all([
        fetchScreener({ sort_by: "change_percent", sort_order: "desc", limit: "10" }),
        fetchSignals(),
      ]);
      setTopMovers(screener.data);
      setTopSignals(signals.data.slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-white/40">Loading...</div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Akademitrading</h1>
        <p className="text-white/60">Screener & sinyal trading saham Indonesia real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="text-3xl font-bold text-emerald-400">{topMovers.length}+</div>
          <div className="text-sm text-white/60 mt-1">Saham Dipantau</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="text-3xl font-bold text-cyan-400">{topSignals.length}</div>
          <div className="text-sm text-white/60 mt-1">Sinyal Hari Ini</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="text-3xl font-bold text-purple-400">12</div>
          <div className="text-sm text-white/60 mt-1">Jenis Sinyal</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="font-semibold">Top Movers</h2>
            <Link href="/screener" className="text-sm text-emerald-400 hover:text-emerald-300">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-white/5">
            {topMovers.slice(0, 5).map((stock) => (
              <Link key={stock.code} href={`/stocks/${stock.code}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div>
                  <div className="font-medium">{stock.code}</div>
                  <div className="text-xs text-white/40">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono">{formatPrice(stock.price)}</div>
                  <div className={`text-sm font-mono ${stock.change_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(stock.change_percent)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="font-semibold">Sinyal Hari Ini</h2>
            <Link href="/signals" className="text-sm text-emerald-400 hover:text-emerald-300">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-white/5">
            {topSignals.map((signal, i) => (
              <Link key={`${signal.code}-${i}`} href={`/stocks/${signal.code}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="font-medium w-14">{signal.code}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${signalColor(signal.signalType)}`}>
                    {signalLabel(signal.signalType)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{formatPrice(signal.price)}</div>
                  <div className={`text-xs font-mono ${signal.change_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(signal.change_percent)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
