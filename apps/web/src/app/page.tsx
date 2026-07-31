"use client";

import { useEffect, useState } from "react";
import { fetchScreener, fetchSignals, type StockItem, type SignalItem } from "@/lib/api";
import { formatPrice, formatPercent, signalColor, signalLabel } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowRight, BarChart3, Clock3, RefreshCw, Search, ShieldCheck } from "lucide-react";

export default function Dashboard() {
  const [topMovers, setTopMovers] = useState<StockItem[]>([]);
  const [topSignals, setTopSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(false);
        const [screener, signals] = await Promise.all([
          fetchScreener({ sort_by: "change_percent", sort_order: "desc", limit: "10" }),
          fetchSignals(),
        ]);
        setTopMovers(screener.data);
        setTopSignals(signals.data.slice(0, 5));
        setUpdatedAt(new Date());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="rounded-xl border border-white/10 divide-y divide-white/5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="rounded-xl border border-white/10 divide-y divide-white/5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-14 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-300"><RefreshCw /></div>
      <h1 className="text-2xl font-bold">Data pasar belum tersedia</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">Koneksi ke penyedia data sedang terganggu. Coba muat ulang untuk mengambil data terbaru.</p>
      <button onClick={() => location.reload()} className="mt-6 rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950">Muat ulang</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:py-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/10 via-slate-900/80 to-cyan-400/5 p-6 sm:p-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Data pasar IDX</span>
            {updatedAt && <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> Diperbarui {updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</span>}
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">Temukan peluang saham dengan data, <span className="text-emerald-300">bukan asumsi.</span></h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Saring saham IDX, pantau momentum, dan validasi sinyal teknikal dalam satu dashboard yang ringkas.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/screener" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300"><Search size={17} /> Mulai screening <ArrowRight size={16} /></Link>
            <Link href="/signals" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"><BarChart3 size={17} /> Lihat sinyal hari ini</Link>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} /> Data analisis, bukan rekomendasi investasi.</p>
        </div>
      </section>

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
