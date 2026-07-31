import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, Clock3, LockKeyhole, Play, Trophy } from "lucide-react";
import { STOCK_GLOSSARY, type GlossaryCategory } from "@/lib/stock-glossary";

export const metadata: Metadata = {
  title: "Akademi Trading Saham",
  description: "Kurikulum trading saham Indonesia dari fondasi, analisis teknikal, manajemen risiko, hingga evaluasi sistem.",
};

const modules = [
  { no: "01", title: "Fondasi Pasar Saham", description: "Mekanisme BEI, order book, dan cara harga bergerak.", lessons: 6, duration: "48 menit", status: "Selesai", progress: 100 },
  { no: "02", title: "Membaca Struktur Harga", description: "Trend, support-resistance, dan market structure.", lessons: 8, duration: "1j 20m", status: "Lanjutkan", progress: 65 },
  { no: "03", title: "Momentum & Volume", description: "Validasi pergerakan dengan volume dan indikator momentum.", lessons: 7, duration: "1j 05m", status: "Mulai", progress: 0 },
  { no: "04", title: "Risk Management", description: "Position sizing, stop loss, dan risk-to-reward.", lessons: 5, duration: "55 menit", status: "Terkunci", progress: 0 },
];

const categories: GlossaryCategory[] = ["Fundamental", "Teknikal", "Perdagangan", "Corporate Action"];

export default function EducationPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:py-12">
      <section className="slate-panel relative overflow-hidden p-6 sm:p-10">
        <div className="market-grid absolute inset-0 opacity-30" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300"><BookOpen size={14}/> Learning dashboard</p>
            <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-5xl">Bangun skill trading,<br/><span className="text-emerald-300">satu sistem setiap hari.</span></h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-400">Materi ringkas, praktik dengan data IDX, dan proses evaluasi yang membantu kamu mengambil keputusan lebih objektif.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur">
            <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Progress belajar</span><strong className="text-emerald-300">41%</strong></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[41%] rounded-full bg-emerald-400" /></div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400"><span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400"/> 9 pelajaran</span><span className="flex items-center gap-1.5"><Clock3 size={14}/> 2j 18m</span></div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Jalur belajar</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Kurikulum trading</h2></div>
          <span className="hidden text-sm text-slate-500 sm:block">4 modul · 26 pelajaran</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((module) => (
            <article key={module.no} className="slate-card p-5 sm:p-6">
              <div className="flex gap-4">
                <div className="font-mono text-sm text-slate-600">{module.no}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3"><h3 className="font-semibold tracking-tight">{module.title}</h3>{module.status === "Terkunci" && <LockKeyhole size={16} className="text-slate-600"/>}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{module.description}</p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">{module.lessons} pelajaran · {module.duration}</span>
                    {module.status !== "Terkunci" && <button className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 hover:text-emerald-200"><Play size={14} fill="currentColor"/> {module.status}</button>}
                  </div>
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${module.progress}%` }} /></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Link href="/screener" className="slate-card group p-6 lg:col-span-2">
          <BarChart3 className="text-cyan-300"/><h2 className="mt-8 text-xl font-semibold">Praktik dengan Market Lab</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Gunakan screener dan sinyal pasar untuk menguji materi yang baru dipelajari.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-300">Buka screener <ArrowRight size={15} className="transition-transform group-hover:translate-x-1"/></span>
        </Link>
        <div className="slate-card p-6"><Trophy className="text-amber-300"/><p className="mt-8 text-xs uppercase tracking-widest text-slate-500">Streak belajar</p><div className="mt-1 text-3xl font-bold">7 hari</div><p className="mt-2 text-sm text-slate-400">Pertahankan ritme. Konsistensi mengalahkan intensitas.</p></div>
      </section>

      <section className="space-y-5 border-t border-white/10 pt-10">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Referensi cepat</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Glosarium saham</h2></div>
        <nav aria-label="Kategori glosarium" className="flex flex-wrap gap-2">{categories.map((category) => <a key={category} href={`#${category.toLowerCase()}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300">{category}</a>)}</nav>
        {categories.map((category) => <section key={category} id={category.toLowerCase()} className="scroll-mt-24 space-y-3 pt-3"><h3 className="text-lg font-semibold">{category}</h3><div className="grid gap-3 md:grid-cols-2">{STOCK_GLOSSARY.filter((item) => item.category === category).map((item) => <article key={item.term} className="slate-card p-5"><div className="flex flex-wrap items-baseline gap-2"><h4 className="font-semibold text-emerald-300">{item.term}</h4>{item.aliases?.length ? <span className="text-xs text-slate-600">{item.aliases.join(" · ")}</span> : null}</div><p className="mt-2 text-sm font-medium text-slate-300">{item.short}</p><p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p></article>)}</div></section>)}
      </section>
    </div>
  );
}
