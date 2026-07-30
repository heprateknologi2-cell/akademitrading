"use client";

import { useEffect, useState } from "react";
import { fetchSignals, type SignalItem } from "@/lib/api";
import { formatPrice, formatPercent, signalColor, signalLabel } from "@/lib/utils";
import Link from "next/link";

function strengthLabel(s: number): string {
  if (s >= 3) return "STRONG";
  if (s >= 2) return "MODERATE";
  return "WEAK";
}

function strengthColor(s: number): string {
  if (s >= 3) return "text-emerald-400";
  if (s >= 2) return "text-amber-400";
  return "text-white/40";
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals().then(res => {
      setSignals(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Sinyal Trading Hari Ini</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-white/40">Loading...</div>
        ) : signals.length === 0 ? (
          <div className="col-span-full text-center py-12 text-white/40">Belum ada sinyal hari ini</div>
        ) : signals.map((s, i) => (
          <Link key={`${s.code}-${i}`} href={`/stocks/${s.code}`}
            className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-all hover:border-white/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">{s.code}</div>
                <div className="text-xs text-white/40">{s.name}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${signalColor(s.signalType)}`}>
                {signalLabel(s.signalType)}
              </span>
            </div>

            <p className="text-sm text-white/70">{s.description}</p>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex gap-3 text-xs">
                <span className="text-white/40">Strength: <span className={strengthColor(s.strength)}>{strengthLabel(s.strength)}</span></span>
                <span className="text-white/40">Score: <span className="text-emerald-400">{s.score}</span></span>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">{formatPrice(s.price)}</div>
                <div className={`text-xs font-mono ${s.change_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(s.change_percent)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
