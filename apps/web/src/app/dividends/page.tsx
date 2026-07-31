"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export interface DividendItem {
  code: string;
  name: string;
  ex_date: string;
  payment_date?: string | null;
  amount?: number | null;
  ratio?: string | null;
  type: string;
}

export default function DividendsPage() {
  const [items, setItems] = useState<DividendItem[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/dividends?upcoming=true&days=90")
      .then((res) => res.json())
      .then((json) => setItems(json.data || []))
      .catch(() => setItems([]));
  }, []);

  const filtered = (items || []).filter((item) => !search || item.code.toLowerCase().includes(search.toLowerCase()) || item.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jadwal Dividen BEI</h1>
        <p className="text-sm text-white/50">Dividen dan aksi korporasi emiten yang akan datang.</p>
      </div>
      <input value={search} onChange={(event) => setSearch(event.target.value.toUpperCase())} placeholder="Filter kode atau nama saham..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-emerald-500/50" />
      <div className="rounded-xl border border-white/10 overflow-hidden">
        {!items ? <div className="space-y-px">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-none" />)}</div> : filtered.length === 0 ? <div className="p-10 text-center text-white/40">Belum ada jadwal dividen.</div> : (
          <div className="divide-y divide-white/5">{filtered.map((item, index) => (
            <div key={`${item.code}-${item.ex_date}-${index}`} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div><Link href={`/stocks/${item.code}`} className="font-semibold text-emerald-400">{item.code}</Link><div className="text-xs text-white/40">{item.name}</div></div>
              <div className="text-sm"><div className="text-white/40">Ex-date</div><div>{new Date(item.ex_date).toLocaleDateString("id-ID", { dateStyle: "medium" })}</div></div>
              <div className="text-right"><div className="text-xs text-white/40">{item.type === "cash" ? "Per Saham" : "Rasio"}</div><div className="font-mono text-emerald-400">{item.amount != null ? `Rp${item.amount.toLocaleString("id-ID")}` : item.ratio || "-"}</div></div>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}
