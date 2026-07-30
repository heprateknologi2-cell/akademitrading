"use client";

import { useEffect, useState, use } from "react";
import { fetchStockDetail } from "@/lib/api";
import { formatPrice, formatPercent, signalColor, signalLabel } from "@/lib/utils";
import Link from "next/link";

export default function StockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockDetail(id).then(res => {
      setData(res.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-white/40">Loading...</div></div>;
  if (!data) return <div className="text-center py-12 text-white/40">Data tidak ditemukan</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Link href="/screener" className="text-sm text-white/40 hover:text-white/60">&larr; Kembali</Link>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{data.code}</h1>
            <span className="text-sm text-white/40">{data.sector}</span>
          </div>
          <div className="text-sm text-white/60">{data.name}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono">{formatPrice(data.price)}</div>
          <div className={`text-lg font-mono ${data.change_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatPercent(data.change_percent)}
          </div>
        </div>
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
            {data.signals.map((s: any, i: number) => (
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
              { label: "RSI (14)", value: data.indicators.rsi, color: data.indicators.rsi < 30 ? "text-blue-400" : data.indicators.rsi > 70 ? "text-red-400" : "" },
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
                <div className={`font-mono text-sm mt-1 ${item.color || ""}`}>{item.value?.toFixed?.(1) ?? item.value ?? "-"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
