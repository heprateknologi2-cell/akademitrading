"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSignals, type SignalItem } from "@/lib/api";
import { formatPrice, formatPercent, signalColor, signalLabel } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useSignalStream } from "@/lib/use-signal-stream";

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
  const [toast, setToast] = useState("");
  const { signals: liveSignals, connected } = useSignalStream();

  useEffect(() => {
    fetchSignals().then(res => {
      setSignals(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const latest = liveSignals[0];
    if (!latest) return;
    const timer = setTimeout(() => setToast(""), 4000);
    queueMicrotask(() => setToast(`Sinyal baru: ${latest.code} · ${signalLabel(latest.signalType)}`));
    if (document.hidden && "Notification" in window && Notification.permission === "granted") {
      new Notification(`Sinyal ${latest.code}`, { body: latest.description });
    }
    return () => clearTimeout(timer);
  }, [liveSignals]);

  const displayedSignals = useMemo(() => {
    const seen = new Set<string>();
    return [...liveSignals, ...signals].filter((signal) => {
      const key = `${signal.code}-${signal.signalType}-${signal.description}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [liveSignals, signals]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">Sinyal Trading Hari Ini</h1>{connected && <span className="animate-pulse rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">LIVE</span>}</div>
      {toast && <div className="fixed right-4 top-20 z-50 rounded-lg border border-emerald-500/30 bg-[#020817] px-4 py-3 text-sm text-emerald-400 shadow-xl">{toast}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-14 ml-auto" />
                </div>
              </div>
            </div>
          ))
        ) : displayedSignals.length === 0 ? (
          <div className="col-span-full text-center py-12 text-white/40">Belum ada sinyal hari ini</div>
        ) : displayedSignals.map((s, i) => (
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
