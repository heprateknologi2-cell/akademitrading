"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { fetchScreener, type StockItem } from "@/lib/api";
import { formatPrice, formatPercent, formatVolume, signalColor, signalLabel } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const SECTORS = [
  "", "Financials", "Consumer Cyclicals", "Consumer Non-Cyclicals",
  "Infrastructure", "Energy", "Basic Materials", "Industrials",
  "Healthcare", "Technology", "Property & Real Estate",
];

function ScreenerContent() {
  const searchParams = useSearchParams();
  const tableRef = useRef<HTMLDivElement>(null);
  const [stocks, setStocks] = useState<StockItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sector, setSector] = useState(searchParams.get("sector") || "");
  const [rsiFilter, setRsiFilter] = useState("");
  const [macdFilter, setMacdFilter] = useState("");
  const [signalFilter, setSignalFilter] = useState("");
  const [minPe, setMinPe] = useState("");
  const [maxPe, setMaxPe] = useState("");
  const [minPbv, setMinPbv] = useState("");
  const [maxPbv, setMaxPbv] = useState("");
  const [minDividendYield, setMinDividendYield] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") || "composite_score");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sort_order") || "desc");

  const load = useCallback(async () => {
    const params: Record<string, string> = { limit: "100", page: page.toString(), sort_by: sortBy, sort_order: sortOrder };
    if (sector) params.sector = sector;
    if (rsiFilter) params.rsi_filter = rsiFilter;
    if (macdFilter) params.macd_filter = macdFilter;
    if (signalFilter) params.signal_filter = signalFilter;
    if (minPe) params.min_pe = minPe;
    if (maxPe) params.max_pe = maxPe;
    if (minPbv) params.min_pbv = minPbv;
    if (maxPbv) params.max_pbv = maxPbv;
    if (minDividendYield) params.min_dividend_yield = minDividendYield;
    if (search.trim()) params.search = search.trim();
    return fetchScreener(params);
  }, [page, sector, rsiFilter, macdFilter, signalFilter, minPe, maxPe, minPbv, maxPbv, minDividendYield, search, sortBy, sortOrder]);

  useEffect(() => {
    let active = true;
    load().then(res => {
      if (!active) return;
      setStocks(res.data);
      setTotal(res.total);
    }).catch(() => { if (active) setStocks([]); });
    return () => { active = false; };
  }, [load]);

  const virtualizer = useVirtualizer({
    count: stocks?.length || 0,
    getScrollElement: () => tableRef.current,
    estimateSize: () => 52,
    overscan: 5,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Screener Saham</h1>

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Cari kode/nama saham..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select value={sector} onChange={e => { setSector(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80">
          <option value="">Semua Sektor</option>
          {SECTORS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={rsiFilter} onChange={e => { setRsiFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80">
          <option value="">RSI: Semua</option>
          <option value="oversold">Oversold (&lt;30)</option>
          <option value="overbought">Overbought (&gt;70)</option>
        </select>

        <select value={macdFilter} onChange={e => { setMacdFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80">
          <option value="">MACD: Semua</option>
          <option value="bullish">Bullish</option>
          <option value="bearish">Bearish</option>
        </select>

        <select value={signalFilter} onChange={e => { setSignalFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80">
          <option value="">Sinyal: Semua</option>
          <option value="golden_cross">Golden Cross</option>
          <option value="death_cross">Death Cross</option>
          <option value="rsi_oversold">RSI Oversold</option>
          <option value="rsi_overbought">RSI Overbought</option>
          <option value="macd_bullish">MACD Bullish</option>
          <option value="breakout">Breakout</option>
          <option value="volume_spike">Volume Spike</option>
        </select>

        <div className="flex items-center gap-1">
          <span className="text-xs text-white/40">PE</span>
          <input type="number" min="0" step="0.1" value={minPe} onChange={e => { setMinPe(e.target.value); setPage(1); }}
            placeholder="min" className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50" />
          <span className="text-xs text-white/40">-</span>
          <input type="number" min="0" step="0.1" value={maxPe} onChange={e => { setMaxPe(e.target.value); setPage(1); }}
            placeholder="max" className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50" />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-white/40">PBV</span>
          <input type="number" min="0" step="0.1" value={minPbv} onChange={e => { setMinPbv(e.target.value); setPage(1); }}
            placeholder="min" className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50" />
          <span className="text-xs text-white/40">-</span>
          <input type="number" min="0" step="0.1" value={maxPbv} onChange={e => { setMaxPbv(e.target.value); setPage(1); }}
            placeholder="max" className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50" />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-white/40">Div Yield ≥</span>
          <input type="number" min="0" step="0.1" value={minDividendYield} onChange={e => { setMinDividendYield(e.target.value); setPage(1); }}
            placeholder="%" className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50" />
        </div>

        <select value={`${sortBy}-${sortOrder}`} onChange={e => { const [s, o] = e.target.value.split("-"); setSortBy(s); setSortOrder(o); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80">
          <option value="composite_score-desc">Score ↓</option>
          <option value="change_percent-desc">Gainer ↓</option>
          <option value="change_percent-asc">Loser ↑</option>
          <option value="price-desc">Harga ↓</option>
          <option value="volume-desc">Volume ↓</option>
        </select>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div ref={tableRef} className="max-h-[680px] overflow-auto">
          <table className="grid min-w-[1100px] w-full text-sm">
            <thead className="sticky top-0 z-10 grid bg-[#0a1020]">
              <tr className="grid grid-cols-[80px_1.5fr_1.2fr_110px_90px_90px_85px_65px_65px_65px_1.5fr] border-b border-white/10 bg-white/5 text-white/60 text-xs uppercase tracking-wider">
                <th className="text-left p-3">Kode</th>
                <th className="text-left p-3">Nama</th>
                <th className="text-left p-3">Sektor</th>
                <th className="text-right p-3">Harga</th>
                <th className="text-right p-3">Change</th>
                <th className="text-right p-3">Volume</th>
                <th className="text-right p-3">MCap</th>
                <th className="text-right p-3">PE</th>
                <th className="text-right p-3">RSI</th>
                <th className="text-right p-3">Score</th>
                <th className="text-left p-3">Sinyal</th>
              </tr>
            </thead>
            <tbody className="relative grid" style={{ height: stocks ? virtualizer.getTotalSize() : undefined }}>
              {stocks === null ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="grid grid-cols-[80px_1.5fr_1.2fr_110px_90px_90px_85px_65px_65px_65px_1.5fr] border-b border-white/5">
                    <td className="p-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-4 w-14 ml-auto" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-4 w-14 ml-auto" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-4 w-10 ml-auto" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-4 w-10 ml-auto" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-4 w-10 ml-auto" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                  </tr>
                ))
              ) : stocks.length === 0 ? (
                <tr><td colSpan={11} className="text-center p-8 text-white/40">Tidak ada data</td></tr>
              ) : virtualizer.getVirtualItems().map((virtualRow) => {
                const stock = stocks[virtualRow.index];
                return (
                <tr key={stock.code} className="absolute left-0 top-0 grid w-full grid-cols-[80px_1.5fr_1.2fr_110px_90px_90px_85px_65px_65px_65px_1.5fr] border-b border-white/5 hover:bg-white/5 transition-colors" style={{ height: virtualRow.size, transform: `translateY(${virtualRow.start}px)` }}>
                  <td className="p-3">
                    <Link href={`/stocks/${stock.code}`} className="font-medium text-emerald-400 hover:text-emerald-300">
                      {stock.code}
                    </Link>
                  </td>
                  <td className="p-3 text-white/70 max-w-[200px] truncate">{stock.name}</td>
                  <td className="p-3 text-white/50">{stock.sector}</td>
                  <td className="p-3 text-right font-mono">{stock.price ? formatPrice(stock.price) : "-"}</td>
                  <td className={`p-3 text-right font-mono ${stock.change_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(stock.change_percent)}
                  </td>
                  <td className="p-3 text-right font-mono text-white/60">{formatVolume(stock.volume)}</td>
                  <td className="p-3 text-right text-white/60">{stock.market_cap?.replace("Cap", "")}</td>
                  <td className="p-3 text-right font-mono text-white/60">{stock.pe?.toFixed(1) ?? "-"}</td>
                  <td className={`p-3 text-right font-mono ${stock.rsi ? (stock.rsi < 30 ? "text-blue-400" : stock.rsi > 70 ? "text-red-400" : "text-white/60") : ""}`}>
                    {stock.rsi?.toFixed(1) ?? "-"}
                  </td>
                  <td className="p-3 text-right">
                    <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${stock.composite_direction === "buy" ? "text-emerald-400" : stock.composite_direction === "sell" ? "text-red-400" : "text-white/40"}`}>
                      {stock.composite_score?.toFixed(0) ?? "-"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {stock.signals?.slice(0, 2).map(s => (
                        <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${signalColor(s)}`}>
                          {signalLabel(s)}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-white/40">
        <span>{total} saham ditemukan</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 rounded border border-white/10 disabled:opacity-30 hover:bg-white/5">Prev</button>
          <span className="px-3 py-1">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={(stocks?.length ?? 0) < 100}
            className="px-3 py-1 rounded border border-white/10 disabled:opacity-30 hover:bg-white/5">Next</button>
        </div>
      </div>
    </div>
  );
}

export default function ScreenerPage() {
  return <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><Skeleton className="h-[680px] w-full" /></div>}><ScreenerContent /></Suspense>;
}
