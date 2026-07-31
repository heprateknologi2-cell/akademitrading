"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import {
  fetchStockDetail,
  fetchStockHistory,
  fetchStocks,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  openPosition,
  type Candle,
  type WatchlistItem,
  type StockSearchItem,
} from "@/lib/api";
import { formatPrice, formatPercent, signalColor, signalLabel } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { StockChart } from "@/components/stock-chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

const RANGES = [
  { value: "1mo", label: "1B" },
  { value: "3mo", label: "3B" },
  { value: "6mo", label: "6B" },
  { value: "1y", label: "1T" },
];

interface StockSignal {
  type: string;
  description: string;
  direction: string;
  score?: number;
}

interface StockIndicators {
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  sma_20?: number;
  sma_50?: number;
  sma_200?: number;
  bb_upper?: number;
  bb_lower?: number;
  atr?: number;
}

interface StockDetail {
  code: string;
  name: string;
  sector?: string;
  price: number;
  change_percent: number;
  market_cap?: string;
  pe?: number;
  pbv?: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  composite_score?: number;
  signals?: StockSignal[];
  indicators?: StockIndicators;
}

interface StockRating {
  rating: "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell";
  buy_count: number;
  sell_count: number;
  neutral_count: number;
  total_signals: number;
  confidence: number;
}

function ratingClass(rating: StockRating["rating"]) {
  if (rating === "Strong Buy") return "border-emerald-500 bg-emerald-500 text-[#020817]";
  if (rating === "Buy") return "border-emerald-500/50 text-emerald-400";
  if (rating === "Strong Sell") return "border-red-500 bg-red-500 text-white";
  if (rating === "Sell") return "border-red-500/50 text-red-400";
  return "border-white/10 bg-white/5 text-white/50";
}

export default function StockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status } = useSession();
  const [data, setData] = useState<StockDetail | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [range, setRange] = useState("6mo");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [compareSearch, setCompareSearch] = useState("");
  const [compareCode, setCompareCode] = useState("");
  const [compareCandles, setCompareCandles] = useState<Candle[]>([]);
  const [compareOptions, setCompareOptions] = useState<StockSearchItem[]>([]);
  const [rating, setRating] = useState<StockRating | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);

  const [wl, setWl] = useState<WatchlistItem | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [wlBusy, setWlBusy] = useState(false);

  const [posOpen, setPosOpen] = useState(false);
  const [posSide, setPosSide] = useState<"long" | "short">("long");
  const [posQty, setPosQty] = useState("");
  const [posEntry, setPosEntry] = useState("");
  const [posStop, setPosStop] = useState("");
  const [posTp, setPosTp] = useState("");
  const [posNotes, setPosNotes] = useState("");
  const [posBusy, setPosBusy] = useState(false);
  const [posError, setPosError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchStockDetail(id).then(res => {
      const detail = res.data as StockDetail;
      setData(detail);
      if (detail?.price) setPosEntry(String(detail.price));
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    fetch(`/api/stocks/${encodeURIComponent(id)}/rating`).then((res) => res.json()).then((json) => setRating(json.data || null)).catch(() => setRating(null));
  }, [id]);

  useEffect(() => {
    fetchStockHistory(id, range).then(res => {
      setCandles(res.data || []);
      setChartLoading(false);
    }).catch(() => setChartLoading(false));
  }, [id, range]);

  useEffect(() => {
    if (!compareCode) return;
    let active = true;
    fetchStockHistory(compareCode, range)
      .then((res) => { if (active) setCompareCandles(res.data || []); })
      .catch(() => { if (active) setCompareCandles([]); });
    return () => { active = false; };
  }, [compareCode, range]);

  useEffect(() => {
    const term = compareSearch.trim();
    if (term.length < 2 || term.toLowerCase() === compareCode.toLowerCase()) return;
    const timer = setTimeout(() => {
      fetchStocks(term).then((res) => setCompareOptions((res.data || []).filter((item) => item.code.toLowerCase() !== id.toLowerCase()).slice(0, 6))).catch(() => setCompareOptions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [compareSearch, compareCode, id]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchWatchlist().then(res => {
      const found = (res.data || []).find((i: WatchlistItem) => i.code.toLowerCase() === id.toLowerCase());
      setWl(found || null);
      if (found?.alert_price) setAlertPrice(String(found.alert_price));
    });
  }, [id, status]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
        <div className="flex items-baseline gap-3 mt-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-24" />
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-7 w-10 rounded-md" />)}
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
  if (!data) return <div className="text-center py-12 text-white/40">Data tidak ditemukan</div>;

  const loggedIn = status === "authenticated";

  async function toggleWatchlist() {
    if (!loggedIn || !data) return;
    setWlBusy(true);
    if (wl) {
      await removeFromWatchlist(id);
      setWl(null);
      setMsg("");
    } else {
      await addToWatchlist(id, alertPrice ? Number(alertPrice) : undefined, data.name);
      setWl({ id: 0, code: id.toUpperCase(), name: data.name, price: data.price, change_percent: data.change_percent, alert_price: alertPrice ? Number(alertPrice) : null, alert_status: "none", notes: null });
    }
    setWlBusy(false);
  }

  async function saveAlert() {
    if (!data) return;
    const price = Number(alertPrice);
    if (!Number.isFinite(price) || price <= 0) return;
    setWlBusy(true);
    await addToWatchlist(id, price, data.name);
    setWl({ id: 0, code: id.toUpperCase(), name: data.name, price: data.price, change_percent: data.change_percent, alert_price: price, alert_status: "none", notes: null });
    setWlBusy(false);
    setAlertOpen(false);
    setMsg(`Alert harga Rp${price.toLocaleString("id-ID")} disimpan`);
    setTimeout(() => setMsg(""), 4000);
  }

  async function handleOpenPosition() {
    if (!data) return;
    const qty = Number(posQty);
    const entry = Number(posEntry);
    if (!Number.isInteger(qty) || qty <= 0) { setPosError("Jumlah lot harus bilangan bulat > 0"); return; }
    if (!Number.isFinite(entry) || entry <= 0) { setPosError("Entry price harus > 0"); return; }
    setPosBusy(true);
    setPosError("");
    const res = await openPosition({
      code: id,
      name: data.name,
      side: posSide,
      quantity: qty,
      entry_price: entry,
      stop_loss: posStop ? Number(posStop) : undefined,
      take_profit: posTp ? Number(posTp) : undefined,
      notes: posNotes || undefined,
    });
    setPosBusy(false);
    if (res.error) { setPosError(res.error); return; }
    setPosOpen(false);
    setPosQty("");
    setPosStop("");
    setPosTp("");
    setPosNotes("");
    setMsg(`Posisi ${id.toUpperCase()} dibuka (${qty} lot @ ${formatPrice(entry)})`);
    setTimeout(() => setMsg(""), 4000);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <Link href="/screener" className="text-sm text-white/40 hover:text-white/60">&larr; Kembali</Link>

      {msg && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm px-4 py-3">{msg}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{data.code}</h1>
            <span className="text-sm text-white/40">{data.sector}</span>
          </div>
          <div className="text-sm text-white/60">{data.name}</div>
        </div>
        <div className="text-right">
          {rating && <button onClick={() => setRatingOpen(true)} className={`mb-2 rounded-full border px-3 py-1 text-xs font-bold ${ratingClass(rating.rating)}`}>{rating.rating} · {rating.confidence}%</button>}
          <div className="text-3xl font-bold font-mono">{formatPrice(data.price)}</div>
          <div className={`text-lg font-mono ${data.change_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatPercent(data.change_percent)}
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialProduct",
            name: data.name,
            identifier: data.code,
            category: "Stock",
            market: "Bursa Efek Indonesia (IDX)",
            offers: { "@type": "Offer", price: data.price, priceCurrency: "IDR" },
          }),
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={toggleWatchlist}
          disabled={!loggedIn || wlBusy}
          className={`text-sm px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
            wl
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
          }`}
        >
          {wl ? "Hapus dari Watchlist" : "+ Watchlist"}
        </button>
        <button
          onClick={() => setAlertOpen(true)}
          disabled={!loggedIn}
          className="text-sm px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          {wl?.alert_price ? `Alert: Rp${wl.alert_price.toLocaleString("id-ID")}` : "Set Alert Harga"}
        </button>
        <button
          onClick={() => setPosOpen(true)}
          disabled={!loggedIn}
          className="text-sm px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
        >
          Buka Posisi
        </button>
        {!loggedIn && (
          <Link href="/auth/login" className="text-xs text-white/40 hover:text-white/60">Masuk untuk fitur watchlist & paper trading &rarr;</Link>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-500 inline-block" /> SMA 20</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> SMA 50</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500 inline-block" /> SMA 200</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-cyan-400 inline-block" /> EMA 20</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-sky-400/50 inline-block" /> Bollinger</span>
          </div>
          <div className="flex items-center gap-1">
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => { setRange(r.value); setChartLoading(true); }}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  range === r.value ? "bg-emerald-500/20 text-emerald-400" : "text-white/40 hover:text-white/70"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative max-w-sm">
          <input
            value={compareSearch}
            onChange={(event) => { setCompareSearch(event.target.value.toUpperCase()); if (!event.target.value) { setCompareCode(""); setCompareCandles([]); setCompareOptions([]); } }}
            placeholder="Bandingkan dengan kode/nama..."
            className="w-full rounded-lg border border-white/10 bg-[#020817] px-3 py-2 text-sm outline-none focus:border-amber-500/50"
          />
          {compareOptions.length > 0 && compareSearch !== compareCode && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-[#020817] shadow-xl">
              {compareOptions.map((item) => (
                <button key={item.code} onClick={() => { setCompareCode(item.code); setCompareSearch(item.code); setCompareOptions([]); }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white/5">
                  <span className="font-medium text-amber-400">{item.code}</span><span className="max-w-48 truncate text-xs text-white/40">{item.name}</span>
                </button>
              ))}
            </div>
          )}
          {compareCode && <div className="mt-1 text-xs text-amber-400">Garis amber: {compareCode} · indeks basis 100</div>}
        </div>
        {chartLoading ? (
          <div className="flex items-center justify-center h-[420px]">
            <Skeleton className="h-[420px] w-full" />
          </div>
        ) : (
          <StockChart candles={candles} compareCandles={compareCandles} compareLabel={compareCode} normalize={Boolean(compareCode)} />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Market Cap", value: data.market_cap },
          { label: "PE Ratio", value: data.pe?.toFixed(1) ?? "-" },
          { label: "PBV", value: data.pbv?.toFixed(2) ?? "-" },
          { label: "Volume", value: data.volume?.toLocaleString() ?? "-" },
          { label: "Open", value: data.open ? formatPrice(data.open) : "-" },
          { label: "High", value: data.high ? formatPrice(data.high) : "-" },
          { label: "Low", value: data.low ? formatPrice(data.low) : "-" },
          { label: "Composite Score", value: data.composite_score?.toFixed(0) ?? "-" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/40">{item.label}</div>
            <div className="font-mono text-sm mt-1">{item.value}</div>
          </div>
        ))}
      </div>

      {data.signals && data.signals.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h2 className="font-semibold">Sinyal</h2>
          <div className="space-y-2">
            {data.signals.map((s: StockSignal, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${signalColor(s.type)}`}>
                    {signalLabel(s.type)}
                  </span>
                  <span className="text-sm text-white/70">{s.description}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={s.direction === "buy" ? "text-emerald-400" : s.direction === "sell" ? "text-red-400" : "text-white/40"}>
                    {s.direction.toUpperCase()}
                  </span>
                  {s.score && <span className="text-emerald-400">Score: {s.score}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.indicators && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h2 className="font-semibold">Indikator Teknikal</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "RSI (14)", value: data.indicators.rsi, color: (data.indicators.rsi ?? 0) < 30 ? "text-blue-400" : (data.indicators.rsi ?? 0) > 70 ? "text-red-400" : "" },
              { label: "MACD", value: data.indicators.macd?.toFixed(2) },
              { label: "MACD Signal", value: data.indicators.macd_signal?.toFixed(2) },
              { label: "SMA 20", value: data.indicators.sma_20 ? formatPrice(data.indicators.sma_20) : "-" },
              { label: "SMA 50", value: data.indicators.sma_50 ? formatPrice(data.indicators.sma_50) : "-" },
              { label: "SMA 200", value: data.indicators.sma_200 ? formatPrice(data.indicators.sma_200) : "-" },
              { label: "BB Upper", value: data.indicators.bb_upper ? formatPrice(data.indicators.bb_upper) : "-" },
              { label: "BB Lower", value: data.indicators.bb_lower ? formatPrice(data.indicators.bb_lower) : "-" },
              { label: "ATR", value: data.indicators.atr ? formatPrice(data.indicators.atr) : "-" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/40">{item.label}</div>
                <div className={`font-mono text-sm mt-1 ${item.color || ""}`}>{typeof item.value === "number" ? item.value.toFixed(1) : item.value ?? "-"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rating Sinyal {data.code}</DialogTitle><DialogDescription>Agregasi sinyal teknikal terbaru, bukan rekomendasi investasi.</DialogDescription></DialogHeader>
          {rating && <div className="space-y-4"><div className="text-center"><span className={`inline-block rounded-full border px-4 py-2 text-sm font-bold ${ratingClass(rating.rating)}`}>{rating.rating}</span><div className="mt-2 text-sm text-white/40">Confidence {rating.confidence}% · {rating.total_signals} sinyal</div></div><div className="grid grid-cols-3 gap-3"><div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center"><div className="text-xs text-emerald-400">Buy</div><div className="text-xl font-bold">{rating.buy_count}</div></div><div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center"><div className="text-xs text-white/40">Netral</div><div className="text-xl font-bold">{rating.neutral_count}</div></div><div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center"><div className="text-xs text-red-400">Sell</div><div className="text-xl font-bold">{rating.sell_count}</div></div></div></div>}
        </DialogContent>
      </Dialog>

      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alert Harga {id.toUpperCase()}</DialogTitle>
            <DialogDescription>
              Anda akan diberitahu saat harga melewati level ini. Simpan otomatis ke watchlist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 block mb-1">Harga Alert (Rp)</label>
              <input
                type="number"
                min="1"
                step="any"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono outline-none focus:border-emerald-500/50"
                placeholder={data.price ? `Harga saat ini: ${data.price.toLocaleString("id-ID")}` : ""}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAlertOpen(false)} className="text-sm px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 transition-colors">
                Batal
              </button>
              <button onClick={saveAlert} disabled={wlBusy} className="text-sm bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                {wlBusy ? "Menyimpan..." : "Simpan Alert"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={posOpen} onOpenChange={(o) => { setPosOpen(o); setPosError(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buka Posisi {id.toUpperCase()}</DialogTitle>
            <DialogDescription>
              Paper trading — hitung P&L dengan harga pasar aktual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPosSide("long")}
                className={`text-sm px-3 py-2 rounded-lg border transition-colors ${posSide === "long" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "border-white/10 text-white/40 hover:bg-white/5"}`}
              >
                Long (Beli)
              </button>
              <button
                onClick={() => setPosSide("short")}
                className={`text-sm px-3 py-2 rounded-lg border transition-colors ${posSide === "short" ? "bg-red-500/20 text-red-400 border-red-500/30" : "border-white/10 text-white/40 hover:bg-white/5"}`}
              >
                Short (Jual)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 block mb-1">Jumlah Lot</label>
                <input type="number" min="1" step="1" value={posQty} onChange={(e) => setPosQty(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Entry Price (Rp)</label>
                <input type="number" min="1" step="any" value={posEntry} onChange={(e) => setPosEntry(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono outline-none focus:border-emerald-500/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 block mb-1">Stop Loss (Rp)</label>
                <input type="number" min="1" step="any" value={posStop} onChange={(e) => setPosStop(e.target.value)} placeholder="Opsional" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Take Profit (Rp)</label>
                <input type="number" min="1" step="any" value={posTp} onChange={(e) => setPosTp(e.target.value)} placeholder="Opsional" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono outline-none focus:border-emerald-500/50" />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Catatan</label>
              <input value={posNotes} onChange={(e) => setPosNotes(e.target.value)} placeholder="Opsional" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-emerald-500/50" />
            </div>
            {posError && <div className="text-xs text-red-400">{posError}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setPosOpen(false)} disabled={posBusy} className="text-sm px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 transition-colors">
                Batal
              </button>
              <button onClick={handleOpenPosition} disabled={posBusy} className="text-sm bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors disabled:opacity-50">
                {posBusy ? "Memproses..." : "Buka Posisi"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
