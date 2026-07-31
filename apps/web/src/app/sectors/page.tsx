"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface SectorItem {
  sector: string;
  avg_change: number;
  advancers: number;
  decliners: number;
  top_gainer: { code: string; change: number };
  top_loser: { code: string; change: number };
  total_market_cap: number;
}

function percent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default function SectorsPage() {
  const [items, setItems] = useState<SectorItem[] | null>(null);
  const [ascending, setAscending] = useState(false);

  useEffect(() => {
    fetch("/api/market/sectors")
      .then((res) => res.json())
      .then((json) => setItems(json.data || []))
      .catch(() => setItems([]));
  }, []);

  const sorted = [...(items || [])].sort((a, b) => ascending ? a.avg_change - b.avg_change : b.avg_change - a.avg_change);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Performa Sektor BEI</h1>
          <p className="text-sm text-white/50">Ringkasan breadth dan perubahan harga tiap sektor.</p>
        </div>
        <button onClick={() => setAscending((value) => !value)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/5">
          Perubahan {ascending ? "↑" : "↓"}
        </button>
      </div>

      <div className="h-80 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {!items ? <Skeleton className="h-full w-full" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid stroke="rgba(255,255,255,.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,.5)", fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="sector" width={140} tick={{ fill: "rgba(255,255,255,.65)", fontSize: 11 }} />
              <Tooltip formatter={(value) => percent(Number(value))} contentStyle={{ background: "#020817", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8 }} />
              <Bar dataKey="avg_change" radius={[0, 4, 4, 0]}>
                {sorted.map((item) => <Cell key={item.sector} fill={item.avg_change >= 0 ? "#10b981" : "#ef4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="p-3 text-left">Sektor</th>
              <th className="p-3 text-right">Perubahan</th>
              <th className="p-3 text-right">Naik / Turun</th>
              <th className="p-3 text-right">Top Gainer</th>
              <th className="p-3 text-right">Top Loser</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {!items ? Array.from({ length: 8 }).map((_, index) => (
              <tr key={index}>{Array.from({ length: 5 }).map((__, col) => <td key={col} className="p-3"><Skeleton className="h-4 w-24 ml-auto first:ml-0" /></td>)}</tr>
            )) : sorted.map((item) => (
              <tr key={item.sector} className="hover:bg-white/[0.03]">
                <td className="p-3"><Link href={`/screener?sector=${encodeURIComponent(item.sector)}`} className="font-medium text-emerald-400 hover:text-emerald-300">{item.sector}</Link></td>
                <td className={`p-3 text-right font-mono ${item.avg_change >= 0 ? "text-emerald-400" : "text-red-400"}`}>{percent(item.avg_change)}</td>
                <td className="p-3 text-right"><span className="text-emerald-400">{item.advancers}</span> / <span className="text-red-400">{item.decliners}</span></td>
                <td className="p-3 text-right"><Link href={`/stocks/${item.top_gainer.code}`} className="hover:text-emerald-300">{item.top_gainer.code} <span className="text-emerald-400">{percent(item.top_gainer.change)}</span></Link></td>
                <td className="p-3 text-right"><Link href={`/stocks/${item.top_loser.code}`} className="hover:text-red-300">{item.top_loser.code} <span className="text-red-400">{percent(item.top_loser.change)}</span></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
