"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowDown, ArrowUp, BarChart3, Bell, Bookmark,
  CheckCircle2, Clock3, Info, RefreshCw, Search, ShieldCheck, SlidersHorizontal,
} from "lucide-react";
import { fetchSignals, type SignalItem } from "@/lib/api";
import { useSignalStream } from "@/lib/use-signal-stream";
import { formatPercent, formatPrice, signalLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskCalculator } from "./risk-calculator";

type Direction = "all" | "bullish" | "bearish" | "caution" | "neutral";
type Sort = "score" | "latest" | "change" | "alphabetical";

function normalizedDirection(signal: SignalItem): Exclude<Direction, "all"> {
  const direction = signal.direction.toLowerCase();
  const type = signal.signalType.toLowerCase();
  if (type.includes("overbought") || type.includes("spike")) return "caution";
  if (["buy", "bullish"].includes(direction)) return "bullish";
  if (["sell", "bearish"].includes(direction)) return "bearish";
  return "neutral";
}

const directionStyle = {
  bullish: { label: "BULLISH", icon: ArrowUp, className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  bearish: { label: "BEARISH", icon: ArrowDown, className: "border-red-400/30 bg-red-400/10 text-red-300" },
  caution: { label: "WASPADA", icon: AlertTriangle, className: "border-amber-400/30 bg-amber-400/10 text-amber-200" },
  neutral: { label: "NETRAL", icon: Info, className: "border-sky-400/30 bg-sky-400/10 text-sky-200" },
};

function impactText(direction: Exclude<Direction, "all">) {
  if (direction === "bullish") return "Kondisi teknikal menguat. Tunggu trigger dan konfirmasi sebelum mengambil keputusan.";
  if (direction === "bearish") return "Momentum melemah. Ini bukan sinyal beli dan risiko penurunan perlu diperhatikan.";
  if (direction === "caution") return "Momentum kuat, tetapi entry baru berisiko mengejar harga. Tunggu konfirmasi.";
  return "Belum ada arah teknikal dominan. Pertimbangkan menunggu struktur yang lebih jelas.";
}

function SignalSkeleton() {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" aria-hidden="true">
    <div className="flex justify-between"><Skeleton className="h-12 w-40" /><Skeleton className="h-8 w-24" /></div>
    <Skeleton className="mt-6 h-6 w-1/2" /><Skeleton className="mt-3 h-16 w-full" />
    <Skeleton className="mt-5 h-24 w-full" /><Skeleton className="mt-5 h-11 w-full" />
  </div>;
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<Direction>("all");
  const [sort, setSort] = useState<Sort>("score");
  const [minScore, setMinScore] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const { signals: liveSignals, connected } = useSignalStream();

  const loadSignals = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetchSignals();
      setSignals(response.data ?? []);
      setUpdatedAt(new Date());
    } catch {
      setError("Sinyal gagal dimuat. Data baru tidak dapat divalidasi.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    fetchSignals().then((response) => {
      if (!active) return;
      setSignals(response.data ?? []);
      setUpdatedAt(new Date());
    }).catch(() => {
      if (active) setError("Sinyal gagal dimuat. Data baru tidak dapat divalidasi.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const allSignals = useMemo(() => {
    const seen = new Set<string>();
    return [...liveSignals, ...signals].filter((item) => {
      const key = `${item.code}-${item.signalType}-${item.description}`;
      if (seen.has(key)) return false;
      seen.add(key); return Number.isFinite(item.price) && item.price > 0;
    });
  }, [liveSignals, signals]);

  const displayed = useMemo(() => allSignals.filter((item) => {
    const text = `${item.code} ${item.name} ${item.signalType}`.toLowerCase();
    return text.includes(query.toLowerCase()) && item.score >= minScore &&
      (direction === "all" || normalizedDirection(item) === direction);
  }).sort((a, b) => {
    if (sort === "alphabetical") return a.code.localeCompare(b.code);
    if (sort === "change") return Math.abs(b.change_percent) - Math.abs(a.change_percent);
    return b.score - a.score;
  }), [allSignals, direction, minScore, query, sort]);

  const updatedLabel = updatedAt?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) ?? "—";

  return <main id="main-content" className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-slate-950 to-sky-500/5 p-5 sm:p-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-300"><BarChart3 className="size-4" /> Pusat keputusan teknikal</div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sinyal Trading Hari Ini</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Pahami apa yang terjadi, kualitas konfirmasinya, dan risiko skenarionya—bukan sekadar daftar indikator.</p>
        </div>
        <Button onClick={() => void loadSignals()} disabled={loading} className="h-11 bg-emerald-400 px-4 text-slate-950 hover:bg-emerald-300">
          <RefreshCw className={loading ? "animate-spin" : ""} /> Perbarui data
        </Button>
      </div>
      <dl className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[ ["Terakhir diperbarui", `${updatedLabel} WIB`], ["Status pasar", "Periksa jam bursa"], ["Sinyal aktif", String(allSignals.length)], ["Sumber & delay", "Provider pasar · delay belum tersedia"] ].map(([term, value]) =>
          <div key={term} className="rounded-xl border border-white/10 bg-black/20 p-3"><dt className="text-xs text-white/45">{term}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}
      </dl>
    </section>

    <aside className="mt-5 flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4 text-sm text-amber-100" role="note">
      <ShieldCheck className="mt-0.5 size-5 shrink-0" />
      <p><strong>Alat bantu analisis, bukan rekomendasi personal.</strong> Skor bukan peluang untung. Data waktu terbit, timeframe, dan delay yang belum disediakan sumber tidak akan direkayasa. Selalu tentukan invalidasi dan ukuran risiko.</p>
    </aside>

    <section aria-label="Filter sinyal" className="sticky top-2 z-20 mt-6 rounded-2xl border border-white/10 bg-slate-950/90 p-3 shadow-xl backdrop-blur">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_repeat(3,auto)]">
        <label className="relative"><span className="sr-only">Cari saham</span><Search className="absolute left-3 top-3 size-4 text-white/40" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kode atau nama saham…" className="h-11 pl-10" /></label>
        <label className="sr-only" htmlFor="direction">Arah sinyal</label>
        <select id="direction" value={direction} onChange={(event) => setDirection(event.target.value as Direction)} className="h-11 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm">
          <option value="all">Semua arah</option><option value="bullish">Bullish</option><option value="bearish">Bearish</option><option value="caution">Waspada</option><option value="neutral">Netral</option>
        </select>
        <label className="sr-only" htmlFor="score">Skor minimum</label>
        <select id="score" value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} className="h-11 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm">
          <option value="0">Semua skor</option><option value="60">Watchlist ≥ 60</option><option value="75">Kandidat utama ≥ 75</option>
        </select>
        <label className="sr-only" htmlFor="sort">Urutkan sinyal</label>
        <select id="sort" value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="h-11 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm">
          <option value="score">Skor tertinggi</option><option value="latest">Sinyal terbaru</option><option value="change">Perubahan terbesar</option><option value="alphabetical">Abjad</option>
        </select>
      </div>
    </section>

    <div className="mt-6 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Kandidat terpantau</h2><p className="mt-1 text-sm text-white/45">{displayed.length} dari {allSignals.length} sinyal ditampilkan</p></div><div className="flex items-center gap-2 text-xs text-white/50"><span className={`size-2 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`} />{connected ? "Stream tersambung" : "Mode data tersimpan"}</div></div>

    {error && <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-5" role="alert"><p className="font-medium">{error}</p><p className="mt-1 text-sm text-white/60">Data terakhir tervalidasi: {updatedLabel} WIB.</p><Button variant="outline" className="mt-4 h-11" onClick={() => void loadSignals()}>Coba lagi</Button></div>}

    {loading ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{[0,1,2,3].map(i => <SignalSkeleton key={i} />)}</div> : displayed.length === 0 ?
      <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-10 text-center"><SlidersHorizontal className="mx-auto size-8 text-white/35" /><h3 className="mt-4 font-semibold">Tidak ada sinyal yang cocok</h3><p className="mt-2 text-sm text-white/50">Reset filter atau kurangi batas skor minimum.</p><Button variant="outline" className="mt-5 h-11" onClick={() => { setQuery(""); setDirection("all"); setMinScore(0); }}>Reset filter</Button></div>
      : <div className="mt-5 grid gap-4 lg:grid-cols-2">{displayed.map((signal) => {
        const kind = normalizedDirection(signal); const config = directionStyle[kind]; const DirectionIcon = config.icon;
        const estimatedStop = signal.stop_loss ?? signal.price * (kind === "bearish" ? 1.03 : 0.97);
        const estimatedTarget = signal.take_profit ?? signal.price * (kind === "bearish" ? 0.94 : 1.06);
        return <article key={`${signal.code}-${signal.signalType}-${signal.description}`} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-white/20">
          <div className="flex items-start justify-between gap-4"><div><Link href={`/stocks/${signal.code}`} className="text-xl font-semibold hover:text-emerald-300">{signal.code}</Link><p className="mt-1 line-clamp-1 text-sm text-white/45">{signal.name}</p></div><div className="text-right"><p className="font-mono text-lg font-semibold">{formatPrice(signal.price)}</p><p className={`font-mono text-sm ${signal.change_percent >= 0 ? "text-emerald-300" : "text-red-300"}`}>{formatPercent(signal.change_percent)}</p></div></div>
          <div className="mt-4 flex flex-wrap gap-2"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}><DirectionIcon className="size-3.5" />{config.label}</span><span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-xs font-medium text-sky-200"><CheckCircle2 className="size-3.5" />{signal.category === "primary" ? "KANDIDAT UTAMA" : "WATCHLIST"}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60">Confluence {signal.score}/100</span></div>
          <div className="mt-5"><h3 className="font-semibold">{signalLabel(signal.signalType)}</h3><p className="mt-2 text-sm leading-6 text-white/60">{signal.description}</p><p className="mt-2 text-sm leading-6 text-white/80">{impactText(kind)}</p></div>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-white/[0.07] bg-black/20 p-4 text-sm">
            <div><dt className="text-xs text-white/40">Timeframe</dt><dd className="mt-1">Belum tersedia</dd></div><div><dt className="text-xs text-white/40">Waktu terbit</dt><dd className="mt-1">Belum tersedia</dd></div>
            <div><dt className="text-xs text-white/40">Harga sinyal</dt><dd className="mt-1">Belum tersedia</dd></div><div><dt className="text-xs text-white/40">Kesegaran</dt><dd className="mt-1">Perlu verifikasi provider</dd></div>
          </dl>
          {signal.components && <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-white/60">{Object.entries(signal.components).map(([name, value]) => <div key={name} className="rounded-lg border border-white/[0.07] p-2"><span className="capitalize">{name.replace("_", " ")}</span><strong className="mt-1 block text-white">{value}</strong></div>)}</div>}
          <div className="mt-5 grid grid-cols-3 gap-2 text-sm"><div><p className="text-xs text-white/40">Trigger</p><p className="mt-1">Tunggu konfirmasi</p></div><div><p className="text-xs text-white/40">Invalidasi*</p><p className="mt-1 font-mono">{formatPrice(estimatedStop)}</p></div><div><p className="text-xs text-white/40">Target edukatif*</p><p className="mt-1 font-mono">{formatPrice(estimatedTarget)}</p></div></div>
          <p className="mt-3 text-xs text-white/35">*Level berbasis ATR dengan rasio risiko/imbal hasil 1:2; tetap verifikasi struktur harga.</p>
          <div className="mt-5 flex gap-2 border-t border-white/[0.07] pt-4"><Button variant="outline" className="h-11 flex-1" render={<Link href={`/stocks/${signal.code}`} />}><BarChart3 /> Buka chart</Button><Button variant="ghost" size="icon-lg" aria-label={`Simpan ${signal.code}`}><Bookmark /></Button><Button variant="ghost" size="icon-lg" aria-label={`Buat alert ${signal.code}`}><Bell /></Button></div>
        </article>;
      })}</div>}

    <RiskCalculator />

    <section className="mt-8 grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><h2 className="flex items-center gap-2 font-semibold"><Info className="size-5 text-sky-300" /> Cara membaca skor</h2><p className="mt-3 text-sm leading-6 text-white/60">Skor adalah peringkat kekuatan kondisi teknikal, bukan probabilitas keuntungan. Komponen ideal mencakup tren, momentum, volume, kualitas breakout, likuiditas, dan keselarasan pasar.</p><Link href="/education" className="mt-4 inline-block text-sm font-medium text-emerald-300 hover:underline">Pelajari metodologi →</Link></div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><h2 className="flex items-center gap-2 font-semibold"><Clock3 className="size-5 text-amber-300" /> Sebelum mengambil keputusan</h2><ol className="mt-3 space-y-2 text-sm text-white/60"><li>1. Pastikan candle acuan sudah ditutup.</li><li>2. Verifikasi volume, likuiditas, dan kondisi IHSG.</li><li>3. Tetapkan invalidasi dan batasi risiko pemula maksimal 0,5% modal.</li></ol></div>
    </section>
  </main>;
}
