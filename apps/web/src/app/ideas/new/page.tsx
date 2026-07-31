"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NewIdeaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm] = useState({ code: "", title: "", body: "", direction: "bullish", chart_thumb: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/ideas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setError(json.error || "Gagal menyimpan ide");
    router.push("/ideas");
  }

  if (status === "loading") return <div className="p-12 text-center text-white/40">Memuat...</div>;
  if (!session?.user) return <div className="p-12 text-center"><Link href="/auth/login" className="text-emerald-400">Masuk untuk melanjutkan</Link></div>;
  if (session.user.tier !== "pro") return <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-3"><h1 className="text-xl font-bold">Fitur Khusus PRO</h1><p className="text-white/50">Pengguna gratis dapat membaca ide, tetapi hanya pengguna PRO yang dapat memposting.</p><Link href="/subscription" className="inline-block text-emerald-400">Upgrade ke PRO →</Link></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div><Link href="/ideas" className="text-sm text-white/40">← Kembali</Link><h1 className="mt-3 text-2xl font-bold">Tulis Ide Trading</h1></div>
      <form onSubmit={submit} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Kode Saham<input required maxLength={10} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} className="block w-full rounded-lg border border-white/10 bg-[#020817] px-3 py-2 outline-none focus:border-emerald-500/50" /></label><label className="space-y-1 text-sm">Arah<select value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value })} className="block w-full rounded-lg border border-white/10 bg-[#020817] px-3 py-2"><option value="bullish">Bullish</option><option value="bearish">Bearish</option><option value="neutral">Netral</option></select></label></div>
        <label className="block space-y-1 text-sm">Judul<input required maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="block w-full rounded-lg border border-white/10 bg-[#020817] px-3 py-2 outline-none focus:border-emerald-500/50" /></label>
        <label className="block space-y-1 text-sm">Analisis<textarea required rows={10} maxLength={10000} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Tuliskan tesis, katalis, risiko, target, dan invalidasi..." className="block w-full resize-y rounded-lg border border-white/10 bg-[#020817] px-3 py-2 outline-none focus:border-emerald-500/50" /></label>
        <label className="block space-y-1 text-sm">URL Chart (opsional)<input type="url" value={form.chart_thumb} onChange={(event) => setForm({ ...form, chart_thumb: event.target.value })} placeholder="https://..." className="block w-full rounded-lg border border-white/10 bg-[#020817] px-3 py-2 outline-none focus:border-emerald-500/50" /><span className="text-xs text-white/30">Gunakan URL publik karena filesystem Netlify tidak persisten.</span></label>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <div className="flex justify-end"><button disabled={busy} className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400 disabled:opacity-50">{busy ? "Menyimpan..." : "Publikasikan Ide"}</button></div>
      </form>
    </div>
  );
}
