"use client";

import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { fetchScreener, type StockItem } from "@/lib/api";
import { formatPrice, formatPercent, formatVolume, signalColor, signalLabel } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Activity, Building2, ChevronDown, Filter, Info, RefreshCw, RotateCcw, Sparkles, TrendingUp, X } from "lucide-react";

const SECTORS = [
  "", "Financials", "Consumer Cyclicals", "Consumer Non-Cyclicals",
  "Infrastructure", "Energy", "Basic Materials", "Industrials",
  "Healthcare", "Technology", "Property & Real Estate",
];

const PRESETS = [
  { id: "top", label: "Pilihan terbaik", description: "Skor tinggi dan transaksi aktif", minAvgValue: "1000000000", sortBy: "composite_score", sortOrder: "desc" },
  { id: "momentum", label: "Momentum", description: "MACD bullish dan liquid", macd: "bullish", minAvgValue: "1000000000", sortBy: "composite_score", sortOrder: "desc" },
  { id: "value", label: "Value", description: "PE dan PBV relatif rendah", maxPe: "15", maxPbv: "2", minAvgValue: "500000000", sortBy: "composite_score", sortOrder: "desc" },
  { id: "oversold", label: "Potensi rebound", description: "RSI di bawah 30, tetap cek tren", rsi: "oversold", sortBy: "composite_score", sortOrder: "desc" },
] as const;

type OpportunityPoint = StockItem & { risk: number; score: number; liquidity: number };

function OpportunityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: OpportunityPoint }> }) {
  const stock = payload?.[0]?.payload;
  if (!active || !stock) return null;
  return (
    <div className="min-w-44 rounded-xl border border-white/10 bg-[#080e1c]/95 p-3 text-xs shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-4"><strong className="text-sm text-white">{stock.code}</strong><span className={stock.composite_direction === "buy" ? "text-emerald-400" : stock.composite_direction === "sell" ? "text-red-400" : "text-slate-400"}>{stock.composite_direction?.toUpperCase()}</span></div>
      <div className="mt-1 max-w-52 truncate text-slate-400">{stock.name}</div>
      <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5 text-slate-400">
        <span>Harga</span><span className="text-right font-mono text-slate-200">{formatPrice(stock.price)}</span>
        <span>Skor</span><span className="text-right font-mono text-slate-200">{stock.score.toFixed(0)}</span>
        <span>Risiko</span><span className="text-right font-mono text-slate-200">{stock.risk.toFixed(1)}%</span>
        <span>RSI</span><span className="text-right font-mono text-slate-200">{stock.rsi?.toFixed(1) ?? "-"}</span>
        <span>Likuiditas</span><span className="text-right font-mono text-slate-200">Rp{formatVolume(stock.liquidity)}</span>
      </div>
      <div className="mt-3 border-t border-white/10 pt-2 text-slate-500">Klik untuk membuka detail</div>
    </div>
  );
}

function ScreenerContent() {
  const router = useRouter();
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
  const [minAvgValue, setMinAvgValue] = useState("");
  const [maxAtrPercent, setMaxAtrPercent] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") || "composite_score");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sort_order") || "desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const activeFilters = [sector, rsiFilter, macdFilter, signalFilter, minPe, maxPe, minPbv, maxPbv, minDividendYield, minAvgValue, maxAtrPercent].filter(Boolean).length;
  const resetFilters = () => {
    setSector(""); setRsiFilter(""); setMacdFilter(""); setSignalFilter("");
    setMinPe(""); setMaxPe(""); setMinPbv(""); setMaxPbv(""); setMinDividendYield("");
    setMinAvgValue(""); setMaxAtrPercent(""); setPage(1);
  };

  const activeFilterChips = [
    sector && { label: sector, clear: () => setSector("") },
    rsiFilter && { label: `RSI ${rsiFilter === "oversold" ? "< 30" : "> 70"}`, clear: () => setRsiFilter("") },
    macdFilter && { label: `MACD ${macdFilter}`, clear: () => setMacdFilter("") },
    signalFilter && { label: signalFilter.replaceAll("_", " "), clear: () => setSignalFilter("") },
    minPe && { label: `PE ≥ ${minPe}`, clear: () => setMinPe("") },
    maxPe && { label: `PE ≤ ${maxPe}`, clear: () => setMaxPe("") },
    minPbv && { label: `PBV ≥ ${minPbv}`, clear: () => setMinPbv("") },
    maxPbv && { label: `PBV ≤ ${maxPbv}`, clear: () => setMaxPbv("") },
    minDividendYield && { label: `Dividen ≥ ${minDividendYield}%`, clear: () => setMinDividendYield("") },
    minAvgValue && { label: `Likuiditas ≥ Rp${formatVolume(Number(minAvgValue))}`, clear: () => setMinAvgValue("") },
    maxAtrPercent && { label: `ATR ≤ ${maxAtrPercent}%`, clear: () => setMaxAtrPercent("") },
  ].filter((chip): chip is { label: string; clear: () => void } => Boolean(chip));

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    resetFilters();
    setRsiFilter("rsi" in preset ? preset.rsi ?? "" : "");
    setMacdFilter("macd" in preset ? preset.macd ?? "" : "");
    setMaxPe("maxPe" in preset ? preset.maxPe ?? "" : "");
    setMaxPbv("maxPbv" in preset ? preset.maxPbv ?? "" : "");
    setMinAvgValue("minAvgValue" in preset ? preset.minAvgValue ?? "" : "");
    setSortBy(preset.sortBy);
    setSortOrder(preset.sortOrder);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

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
    if (minAvgValue) params.min_avg_value = minAvgValue;
    if (maxAtrPercent) params.max_atr_percent = maxAtrPercent;
    if (debouncedSearch) params.search = debouncedSearch;
    return fetchScreener(params);
  }, [page, sector, rsiFilter, macdFilter, signalFilter, minPe, maxPe, minPbv, maxPbv, minDividendYield, minAvgValue, maxAtrPercent, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    let active = true;
    setStocks(null);
    setError("");
    load().then(res => {
      if (!active) return;
      setStocks(res.data);
      setTotal(res.total);
      setUpdatedAt(new Date());
    }).catch(() => {
      if (!active) return;
      setStocks([]);
      setTotal(0);
      setError("Data screener gagal dimuat. Periksa koneksi lalu coba lagi.");
    });
    return () => { active = false; };
  }, [load, retryKey]);

  const changeSort = (column: string) => {
    setPage(1);
    if (sortBy === column) setSortOrder(order => order === "desc" ? "asc" : "desc");
    else { setSortBy(column); setSortOrder("desc"); }
  };

  const sortMark = (column: string) => sortBy === column ? (sortOrder === "desc" ? " ↓" : " ↑") : "";
  const opportunityData = useMemo(() => (stocks ?? [])
    .filter(stock => Number.isFinite(stock.atr_percent) && Number.isFinite(stock.composite_score) && stock.atr_percent >= 0)
    .map(stock => ({ ...stock, risk: stock.atr_percent, score: stock.composite_score, liquidity: Math.max(stock.avg_value_20 || 0, 1) })), [stocks]);

  const virtualizer = useVirtualizer({
    count: stocks?.length || 0,
    getScrollElement: () => tableRef.current,
    estimateSize: () => 52,
    overscan: 5,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Screener Saham</h1><p className="mt-1 text-sm text-slate-400">Saring saham IDX berdasarkan teknikal dan fundamental.</p></div>
        <button type="button" onClick={() => setFiltersOpen(value => !value)} aria-expanded={filtersOpen}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:border-emerald-400/30 hover:bg-emerald-400/5">
          <Filter size={16} /> Filter {activeFilters > 0 && <span className="rounded-full bg-emerald-400 px-1.5 text-xs font-bold text-slate-950">{activeFilters}</span>}
        </button>
      </div>

      <section aria-labelledby="preset-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 id="preset-heading" className="text-sm font-semibold text-slate-200">Mulai cepat</h2>
          <span className="text-xs text-slate-500">Preset dapat disesuaikan lagi lewat filter.</span>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {PRESETS.map(preset => (
            <button key={preset.id} type="button" onClick={() => applyPreset(preset)}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-emerald-400/30 hover:bg-emerald-400/5">
              <span className="block text-sm font-medium text-slate-100">{preset.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

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

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>{stocks === null ? "Memuat data…" : `${total} saham ditemukan`}</span>
        <span>{updatedAt ? `Diperbarui ${updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "Data pasar dapat tertunda"}</span>
      </div>

      {activeFilterChips.length > 0 && <div className="flex flex-wrap items-center gap-2" aria-label="Filter aktif">
        {activeFilterChips.map(chip => <button key={chip.label} type="button" onClick={() => { chip.clear(); setPage(1); }}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-400/15" aria-label={`Hapus filter ${chip.label}`}>
          {chip.label}<X size={12} />
        </button>)}
        <button type="button" onClick={resetFilters} className="px-2 py-1.5 text-xs text-slate-400 hover:text-white">Hapus semua</button>
      </div>}

      {filtersOpen && <section aria-label="Panel filter" className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#101827] to-[#0b1220] shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/20"><Filter size={16} /></span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-100">Sesuaikan hasil</h2>
              <p className="truncate text-xs text-slate-500">{activeFilters ? `${activeFilters} filter aktif · ${stocks === null ? "Memuat…" : `${total} saham cocok`}` : "Pilih kriteria saham yang ingin ditampilkan"}</p>
            </div>
          </div>
          <button type="button" onClick={() => setFiltersOpen(false)} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.07] hover:text-white" aria-label="Tutup filter"><X size={17} /></button>
        </div>

        <div className="grid gap-px bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
        <label className="group bg-[#0d1523] p-4 transition hover:bg-[#111b2b]">
          <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><Building2 size={13} className="text-emerald-400/70" /> Sektor</span>
        <select value={sector} onChange={e => { setSector(e.target.value); setPage(1); }}
          className="block w-full cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-slate-200 outline-none [color-scheme:dark] focus:ring-0 [&>option]:bg-slate-900 [&>option]:text-slate-100">
          <option value="">Pilih sektor</option>
          {SECTORS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select></label>

        <label className="group bg-[#0d1523] p-4 transition hover:bg-[#111b2b]">
          <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><Activity size={13} className="text-sky-400/70" /> RSI</span>
        <select value={rsiFilter} onChange={e => { setRsiFilter(e.target.value); setPage(1); }}
          className="block w-full cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-slate-200 outline-none [color-scheme:dark] focus:ring-0 [&>option]:bg-slate-900 [&>option]:text-slate-100">
          <option value="">Semua level RSI</option>
          <option value="oversold">Oversold (&lt;30)</option>
          <option value="overbought">Overbought (&gt;70)</option>
        </select></label>

        <label className="group bg-[#0d1523] p-4 transition hover:bg-[#111b2b]">
          <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><TrendingUp size={13} className="text-violet-400/70" /> MACD</span>
        <select value={macdFilter} onChange={e => { setMacdFilter(e.target.value); setPage(1); }}
          className="block w-full cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-slate-200 outline-none [color-scheme:dark] focus:ring-0 [&>option]:bg-slate-900 [&>option]:text-slate-100">
          <option value="">Semua tren MACD</option>
          <option value="bullish">Bullish</option>
          <option value="bearish">Bearish</option>
        </select></label>

        <label className="group bg-[#0d1523] p-4 transition hover:bg-[#111b2b]">
          <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><Sparkles size={13} className="text-amber-400/70" /> Sinyal</span>
        <select value={signalFilter} onChange={e => { setSignalFilter(e.target.value); setPage(1); }}
          className="block w-full cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-slate-200 outline-none [color-scheme:dark] focus:ring-0 [&>option]:bg-slate-900 [&>option]:text-slate-100">
          <option value="">Semua rekomendasi</option>
          <option value="golden_cross">Golden Cross</option>
          <option value="death_cross">Death Cross</option>
          <option value="rsi_oversold">RSI Oversold</option>
          <option value="rsi_overbought">RSI Overbought</option>
          <option value="macd_bullish">MACD Bullish</option>
          <option value="breakout">Breakout</option>
          <option value="volume_spike">Volume Spike</option>
        </select></label>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3 sm:px-5">
          <button type="button" onClick={() => setAdvancedFiltersOpen(value => !value)} aria-expanded={advancedFiltersOpen}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-white">Filter lanjutan <ChevronDown size={14} className={`transition-transform ${advancedFiltersOpen ? "rotate-180" : ""}`} /></button>
          {activeFilters > 0 && <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-red-300"><RotateCcw size={12} /> Reset</button>}
        </div>

        {advancedFiltersOpen && <div className="grid gap-4 border-t border-white/[0.07] bg-black/10 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">

        <fieldset className="space-y-1.5"><legend className="text-xs font-medium text-slate-400">Rentang PE</legend><div className="flex items-center gap-2">
          <input type="number" min="0" step="0.1" value={minPe} onChange={e => { setMinPe(e.target.value); setPage(1); }}
            placeholder="Minimum" aria-label="PE minimum" className="min-w-0 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50" />
          <span className="text-xs text-white/40">-</span>
          <input type="number" min="0" step="0.1" value={maxPe} onChange={e => { setMaxPe(e.target.value); setPage(1); }}
            placeholder="Maksimum" aria-label="PE maksimum" className="min-w-0 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50" />
        </div></fieldset>

        <fieldset className="space-y-1.5"><legend className="text-xs font-medium text-slate-400">Rentang PBV</legend><div className="flex items-center gap-2">
          <input type="number" min="0" step="0.1" value={minPbv} onChange={e => { setMinPbv(e.target.value); setPage(1); }}
            placeholder="Minimum" aria-label="PBV minimum" className="min-w-0 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50" />
          <span className="text-xs text-white/40">-</span>
          <input type="number" min="0" step="0.1" value={maxPbv} onChange={e => { setMaxPbv(e.target.value); setPage(1); }}
            placeholder="Maksimum" aria-label="PBV maksimum" className="min-w-0 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50" />
        </div></fieldset>

        <label className="space-y-1.5 text-xs font-medium text-slate-400">Dividend yield minimum (%)
          <input type="number" min="0" step="0.1" value={minDividendYield} onChange={e => { setMinDividendYield(e.target.value); setPage(1); }}
            placeholder="Contoh: 3" className="block w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50" />
        </label>

        <label className="space-y-1.5 text-xs font-medium text-slate-400">Likuiditas harian minimum
        <select value={minAvgValue} onChange={e => { setMinAvgValue(e.target.value); setPage(1); }} title="Rata-rata nilai transaksi 20 hari"
          className="block w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80">
          <option value="">Semua likuiditas</option>
          <option value="100000000">≥ Rp100 juta/hari</option>
          <option value="500000000">≥ Rp500 juta/hari</option>
          <option value="1000000000">≥ Rp1 miliar/hari</option>
          <option value="5000000000">≥ Rp5 miliar/hari</option>
        </select></label>

        <label className="space-y-1.5 text-xs font-medium text-slate-400">Volatilitas maksimum
        <select value={maxAtrPercent} onChange={e => { setMaxAtrPercent(e.target.value); setPage(1); }} title="ATR sebagai persentase harga; makin tinggi makin volatil"
          className="block w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80">
          <option value="">Semua volatilitas</option>
          <option value="2">ATR ≤ 2% (rendah)</option>
          <option value="4">ATR ≤ 4% (moderat)</option>
          <option value="6">ATR ≤ 6% (tinggi)</option>
        </select></label>

        <label className="space-y-1.5 text-xs font-medium text-slate-400">Urutkan hasil
        <select value={`${sortBy}-${sortOrder}`} onChange={e => { const [s, o] = e.target.value.split("-"); setSortBy(s); setSortOrder(o); }}
          className="block w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80">
          <option value="composite_score-desc">Score ↓</option>
          <option value="change_percent-desc">Gainer ↓</option>
          <option value="change_percent-asc">Loser ↑</option>
          <option value="price-desc">Harga ↓</option>
          <option value="volume-desc">Volume ↓</option>
          <option value="avg_value_20-desc">Likuiditas ↓</option>
        </select></label>
        </div>}

      </section>}

      <section aria-labelledby="opportunity-heading" className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div><h2 id="opportunity-heading" className="font-semibold text-slate-100">Peta Peluang</h2><p className="mt-1 text-xs text-slate-500">Cari posisi di kiri atas: skor tinggi dengan risiko lebih rendah.</p></div>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-500"><span><i className="mr-1.5 inline-block size-2 rounded-full bg-emerald-400" />Buy</span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-slate-400" />Netral</span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-red-400" />Sell</span><span>Ukuran = likuiditas</span></div>
        </div>
        <div className="mt-4 h-[300px] w-full sm:h-[360px]">
          {stocks === null ? <Skeleton className="h-full w-full rounded-xl" /> : opportunityData.length === 0 ? <div className="grid h-full place-items-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">Belum ada data untuk divisualisasikan.</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                <XAxis type="number" dataKey="risk" name="Risiko" unit="%" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Risiko / ATR (%)", position: "insideBottom", offset: -4, fill: "#64748b", fontSize: 11 }} />
                <YAxis type="number" dataKey="score" name="Skor" domain={["dataMin - 5", "dataMax + 5"]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                <ZAxis type="number" dataKey="liquidity" range={[45, 380]} />
                <Tooltip cursor={{ stroke: "rgba(255,255,255,0.16)", strokeDasharray: "4 4" }} content={<OpportunityTooltip />} />
                <Scatter data={opportunityData} onClick={(point) => { const stock = point.payload as OpportunityPoint | undefined; if (stock) router.push(`/stocks/${stock.code}`); }} className="cursor-pointer" shape={(props: { cx?: number; cy?: number; size?: number; payload?: OpportunityPoint }) => {
                  const { cx = 0, cy = 0, size = 64, payload } = props;
                  const radius = Math.sqrt(size / Math.PI);
                  const fill = payload?.composite_direction === "buy" ? "#34d399" : payload?.composite_direction === "sell" ? "#f87171" : "#94a3b8";
                  return <circle cx={cx} cy={cy} r={radius} fill={fill} fillOpacity={0.72} stroke={fill} strokeWidth={1.5} />;
                }} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <div className="hidden rounded-xl border border-white/10 overflow-hidden md:block">
        <div ref={tableRef} className="max-h-[680px] overflow-auto">
          <table className="grid min-w-[1100px] w-full text-sm">
            <thead className="sticky top-0 z-10 grid bg-[#0a1020]">
              <tr className="grid grid-cols-[80px_1.5fr_1.2fr_110px_90px_90px_85px_65px_65px_65px_1.5fr] border-b border-white/10 bg-white/5 text-white/60 text-xs uppercase tracking-wider">
                <th className="text-left p-3">Kode</th>
                <th className="text-left p-3">Nama</th>
                <th className="text-left p-3">Sektor</th>
                <th className="text-right p-3"><button type="button" onClick={() => changeSort("price")} className="hover:text-white" title="Urutkan berdasarkan harga">Harga{sortMark("price")}</button></th>
                <th className="text-right p-3"><button type="button" onClick={() => changeSort("change_percent")} className="hover:text-white" title="Urutkan berdasarkan perubahan harian">Change{sortMark("change_percent")}</button></th>
                <th className="text-right p-3"><button type="button" onClick={() => changeSort("avg_value_20")} className="hover:text-white" title="Rata-rata nilai transaksi 20 hari">Likuiditas{sortMark("avg_value_20")}</button></th>
                <th className="text-right p-3">MCap</th>
                <th className="text-right p-3"><span title="Price to Earnings: valuasi harga dibanding laba">PE</span></th>
                <th className="text-right p-3"><span title="Relative Strength Index: di bawah 30 oversold, di atas 70 overbought">RSI</span></th>
                <th className="text-right p-3"><button type="button" onClick={() => changeSort("composite_score")} className="hover:text-white" title="Gabungan indikator teknikal; bukan rekomendasi beli">Score{sortMark("composite_score")}</button></th>
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
                <tr><td colSpan={11} className="text-center p-8 text-white/40">{error || "Tidak ada saham yang cocok. Coba reset filter."}</td></tr>
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
                  <td className="p-3 text-right font-mono text-xs text-white/60" title={`Volume hari ini ${formatVolume(stock.volume)}`}>{stock.avg_value_20 ? `Rp${formatVolume(stock.avg_value_20)}` : "-"}</td>
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

      <div className="grid gap-3 md:hidden">
        {stocks === null ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />) : stocks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">{error || "Tidak ada saham yang cocok. Coba reset filter."}</div>
        ) : stocks.map(stock => (
          <Link key={stock.code} href={`/stocks/${stock.code}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]">
            <div className="flex items-start justify-between gap-3">
              <div><div className="font-semibold text-emerald-300">{stock.code}</div><div className="mt-1 line-clamp-1 text-xs text-slate-400">{stock.name}</div></div>
              <div className="text-right"><div className="font-mono text-sm">{stock.price ? formatPrice(stock.price) : "-"}</div><div className={`font-mono text-xs ${stock.change_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatPercent(stock.change_percent)}</div></div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 border-t border-white/5 pt-3 text-xs">
              <div><span className="block text-slate-500">Sektor</span><span className="mt-1 block truncate text-slate-300">{stock.sector}</span></div>
              <div><span className="block text-slate-500">RSI</span><span className="mt-1 block font-mono text-slate-300">{stock.rsi?.toFixed(1) ?? "-"}</span></div>
              <div><span className="block text-slate-500">Risiko</span><span className="mt-1 block font-mono text-slate-300">{stock.atr_percent ? `${stock.atr_percent.toFixed(1)}%` : "-"}</span></div>
              <div><span className="block text-slate-500">Skor</span><span className="mt-1 block font-mono text-slate-300">{stock.composite_score?.toFixed(0) ?? "-"}</span></div>
            </div>
            {stock.signals?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{stock.signals.slice(0, 2).map(s => <span key={s} className={`rounded-full border px-2 py-0.5 text-[10px] ${signalColor(s)}`}>{signalLabel(s)}</span>)}</div>}
          </Link>
        ))}
      </div>

      {error && <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200 sm:flex-row">
        <span>{error}</span>
        <button type="button" onClick={() => setRetryKey(key => key + 1)} className="inline-flex items-center gap-2 rounded-lg border border-red-300/20 px-3 py-2 hover:bg-red-300/10"><RefreshCw size={14} /> Coba lagi</button>
      </div>}

      <div className="flex items-start gap-2 rounded-xl border border-blue-400/15 bg-blue-400/5 p-4 text-xs leading-5 text-slate-400">
        <Info size={16} className="mt-0.5 shrink-0 text-blue-300" />
        <p>Score dan sinyal adalah alat bantu penyaringan, bukan rekomendasi transaksi. Buka detail saham untuk memeriksa tren, risiko, likuiditas, dan menentukan batas kerugian sebelum mengambil posisi.</p>
      </div>

      <div className="flex flex-col justify-between gap-3 text-sm text-slate-400 sm:flex-row sm:items-center">
        <span>{total} saham ditemukan</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 rounded border border-white/10 disabled:opacity-30 hover:bg-white/5">Sebelumnya</button>
          <span className="px-3 py-1">Halaman {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={(stocks?.length ?? 0) < 100}
            className="px-3 py-1 rounded border border-white/10 disabled:opacity-30 hover:bg-white/5">Berikutnya</button>
        </div>
      </div>
    </div>
  );
}

export default function ScreenerPage() {
  return <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><Skeleton className="h-[680px] w-full" /></div>}><ScreenerContent /></Suspense>;
}
