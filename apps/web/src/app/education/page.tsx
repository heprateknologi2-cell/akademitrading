import type { Metadata } from "next";
import { STOCK_GLOSSARY, type GlossaryCategory } from "@/lib/stock-glossary";

export const metadata: Metadata = {
  title: "Glosarium Saham Indonesia",
  description: "Istilah fundamental, teknikal, perdagangan BEI, dan corporate action untuk investor saham Indonesia.",
};

const categories: GlossaryCategory[] = ["Fundamental", "Teknikal", "Perdagangan", "Corporate Action"];

export default function EducationPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:py-12">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-medium text-emerald-400">Pusat Edukasi</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Glosarium Saham Indonesia</h1>
        <p className="leading-relaxed text-white/55">Penjelasan ringkas istilah yang muncul di analisis Akademitrading. Gunakan sebagai materi belajar, bukan saran investasi.</p>
      </header>

      <nav aria-label="Kategori glosarium" className="flex flex-wrap gap-2">
        {categories.map((category) => <a key={category} href={`#${encodeURIComponent(category.toLowerCase())}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/65 hover:border-emerald-500/40 hover:text-emerald-400">{category}</a>)}
      </nav>

      {categories.map((category) => (
        <section key={category} id={category.toLowerCase()} className="scroll-mt-24 space-y-4">
          <h2 className="text-xl font-semibold">{category}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {STOCK_GLOSSARY.filter((item) => item.category === category).map((item) => (
              <article key={item.term} id={item.term.toLowerCase()} className="scroll-mt-24 rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="font-semibold text-emerald-400">{item.term}</h3>
                  {item.aliases?.length ? <span className="text-xs text-white/35">{item.aliases.join(" · ")}</span> : null}
                </div>
                <p className="mt-2 text-sm font-medium text-white/75">{item.short}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
