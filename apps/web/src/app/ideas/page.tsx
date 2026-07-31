"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";

interface IdeaItem {
  id: number;
  userId: string;
  code: string;
  title: string;
  body: string;
  direction: string | null;
  chartThumb: string | null;
  likes: number | null;
  createdAt: string | null;
  liked_by_user: boolean;
}

export default function IdeasPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<IdeaItem[] | null>(null);

  useEffect(() => {
    fetch("/api/ideas").then((res) => res.json()).then((json) => setItems(json.data || [])).catch(() => setItems([]));
  }, []);

  async function toggleLike(id: number) {
    const res = await fetch(`/api/ideas/${id}/like`, { method: "POST" });
    if (!res.ok) return;
    const json = await res.json();
    setItems((current) => current?.map((item) => item.id === id ? { ...item, liked_by_user: json.data.liked, likes: json.data.likes } : item) || []);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Ide Trading Komunitas</h1><p className="text-sm text-white/50">Analisis dan pandangan saham dari komunitas.</p></div>
        {session?.user?.tier === "pro" ? <Link href="/ideas/new" className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400">Tulis Ide</Link> : <Link href="/subscription" className="rounded-lg border border-amber-500/30 bg-amber-500/20 px-4 py-2 text-sm text-amber-400">Upgrade untuk Posting</Link>}
      </div>
      {!items ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-56 w-full rounded-xl" />) : items.length === 0 ? <div className="rounded-xl border border-white/10 p-12 text-center text-white/40">Belum ada ide komunitas.</div> : items.map((item) => (
        <article key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Link href={`/stocks/${item.code}`} className="font-bold text-emerald-400">{item.code}</Link><span className={`rounded-full border px-2 py-0.5 text-xs ${item.direction === "bullish" ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400" : item.direction === "bearish" ? "border-red-500/30 bg-red-500/20 text-red-400" : "border-white/10 text-white/40"}`}>{item.direction || "neutral"}</span></div><h2 className="mt-2 text-lg font-semibold">{item.title}</h2></div><time className="text-xs text-white/30">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" }) : ""}</time></div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-white/70">{item.body}</p>
          {item.chartThumb && <a href={item.chartThumb} target="_blank" rel="noreferrer" className="block truncate text-xs text-cyan-400">Lihat chart pendukung ↗</a>}
          <div className="flex items-center justify-between border-t border-white/5 pt-3"><span className="text-xs text-white/30">Oleh komunitas #{item.userId.slice(0, 6)}</span><button disabled={!session?.user} onClick={() => toggleLike(item.id)} className={`rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 ${item.liked_by_user ? "border-red-500/30 bg-red-500/20 text-red-400" : "border-white/10 text-white/50 hover:bg-white/5"}`}>♥ {item.likes || 0}</button></div>
        </article>
      ))}
    </div>
  );
}
