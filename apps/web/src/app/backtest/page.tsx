"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { formatPercent } from "@/lib/utils";

interface Trade {
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  pnlPercent: number;
  holdDays: number;
}

interface BacktestResult {
  code: string;
  strategy: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  maxDrawdown: number;
  avgHoldDays: number;
  bestTrade: number;
  worstTrade: number;
  trades: Trade[];
}

const STRATEGIES = [
  { id: "sma_20_50", label: "SMA 20/50 Crossover" },
  { id: "sma_50_200", label: "SMA 50/200 Crossover" },
  { id: "rsi", label: "RSI (14) Oversold/Overbought" },
];

const PERIODS = [
  { id: "6mo", label: "6 Bulan" },
  { id: "1y", label: "1 Tahun" },
  { id: "3y", label: "3 Tahun" },
];

function formatRupiah(n: number): string {
  return "Rp" + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

function formatDate(d: string): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
}

export default function BacktestPage() {
  const { data: session } = useSession();
  const [code, setCode] = useState("");
  const [strategy, setStrategy] = useState("sma_20_50");
  const [period, setPeriod] = useState("1y");
  const [capital, setCapital] = useState("10000000");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPro = session?.user?.tier === "pro";

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase(), strategy, period, capital: Number(capital) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Backtest gagal");
      } else {
        setResult(data.data);
      }
    } catch {
      setError("Terjadi kesalahan");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Backtest Strategi</h1>
        <p className="text-sm text-white/50 mt-1">Uji strategi trading pada data historis saham</p>
      </div>

      {!isPro && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          Backtest hanya tersedia untuk member PRO.{" "}
          <a href="/subscription" className="underline font-medium">Upgrade sekarang</a>
        </div>
      )}

      <form onSubmit={handleRun} className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-white/50 font-medium block mb-1">Kode Saham</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="BBCA"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50 uppercase"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 font-medium block mb-1">Strategi</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              {STRATEGIES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 font-medium block mb-1">Periode</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              {PERIODS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 font-medium block mb-1">Modal (Rp)</label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !isPro}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-medium rounded-lg px-6 py-2.5 text-sm transition-colors"
        >
          {loading ? "Menjalankan..." : "Jalankan Backtest"}
        </button>
      </form>

      {result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{result.code} — {result.strategy}</h2>
              <span className="text-xs text-white/40">
                {formatDate(result.startDate)} — {formatDate(result.endDate)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-white/40">Total Return</p>
                <p className={`text-lg font-bold ${result.totalReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatRupiah(result.totalReturn)}
                </p>
                <p className={`text-xs ${result.totalReturnPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(result.totalReturnPercent)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white/40">Nilai Akhir</p>
                <p className="text-lg font-bold">{formatRupiah(result.finalValue)}</p>
                <p className="text-xs text-white/40">dari {formatRupiah(result.initialCapital)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white/40">Win Rate</p>
                <p className="text-lg font-bold">{result.winRate.toFixed(1)}%</p>
                <p className="text-xs text-white/40">{result.winTrades}W / {result.lossTrades}L</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white/40">Max Drawdown</p>
                <p className="text-lg font-bold text-red-400">{result.maxDrawdown.toFixed(1)}%</p>
                <p className="text-xs text-white/40">Avg hold: {result.avgHoldDays} hari</p>
              </div>
            </div>
          </div>

          {result.trades.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="px-6 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold">Riwayat Trade ({result.totalTrades})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-white/40 border-b border-white/5">
                      <th className="text-left px-6 py-2 font-medium">Entry</th>
                      <th className="text-left px-4 py-2 font-medium">Exit</th>
                      <th className="text-right px-4 py-2 font-medium">Entry Price</th>
                      <th className="text-right px-4 py-2 font-medium">Exit Price</th>
                      <th className="text-right px-4 py-2 font-medium">P&L</th>
                      <th className="text-right px-6 py-2 font-medium">Hari</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((t, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="px-6 py-2.5 text-white/60">{formatDate(t.entryDate)}</td>
                        <td className="px-4 py-2.5 text-white/60">{formatDate(t.exitDate)}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{t.entryPrice.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{t.exitPrice.toLocaleString()}</td>
                        <td className={`px-4 py-2.5 text-right font-mono font-medium ${t.pnlPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {formatPercent(t.pnlPercent)}
                        </td>
                        <td className="px-6 py-2.5 text-right text-white/40">{t.holdDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
