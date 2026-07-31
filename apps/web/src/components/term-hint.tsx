import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { findGlossaryTerm } from "@/lib/stock-glossary";

export function TermHint({ term, label }: { term: string; label?: string }) {
  const entry = findGlossaryTerm(term);
  if (!entry) return <>{label ?? term}</>;

  return (
    <span className="group relative inline-flex items-center gap-1">
      <span>{label ?? term}</span>
      <button type="button" aria-label={`Penjelasan ${entry.term}`} className="peer rounded-full text-white/30 hover:text-emerald-400 focus:text-emerald-400">
        <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 hidden w-64 rounded-lg border border-white/10 bg-slate-950 p-3 text-left normal-case shadow-xl group-hover:block peer-focus:block">
        <span className="block text-xs font-semibold text-emerald-400">{entry.term}</span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-300">{entry.short}</span>
        <Link href={`/education#${encodeURIComponent(entry.term.toLowerCase())}`} className="pointer-events-auto mt-2 inline-block text-xs text-emerald-400 hover:underline">Pelajari selengkapnya</Link>
      </span>
    </span>
  );
}
