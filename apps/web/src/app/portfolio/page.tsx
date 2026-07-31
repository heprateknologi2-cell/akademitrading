"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  fetchPortfolio,
  closePosition,
  deletePosition,
  type PortfolioData,
  type Position,
} from "@/lib/api";
import { formatPrice, formatPercent } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

const EMPTY: PortfolioData = {
  summary: {
    invested: 0,
    market_value: 0,
    unrealized_pnl: 0,
    realized_pnl: 0,
    total_pnl: 0,
    total_pnl_percent: 0,
    open_count: 0,
    closed_count: 0,
  },
  open: [],
  closed: [],
};

function pnlClass(v: number) {
  return v > 0 ? "text-emerald-400" : v < 0 ? "text-red-400" : "text-white/60";
}

export default function PortfolioPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<PortfolioData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState<Position | null>(null);
  const [exitPrice, setExitPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => {
    fetchPortfolio().then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => {
      setData(EMPTY);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (status === "loading" || !session?.user) return;
    fetchPortfolio().then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => {
      setData(EMPTY);
      setLoading(false);
    });
  }, [session, status]);

  if (status === "loading" || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-white/40">Loading...</div></div>;
  }

  if (!session?.user) {
    return (
      <div className="text-center py-16 text-white/60">
        <p>Masuk untuk melihat portofolio Anda.</p>
        <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 mt-2 inline-block">Masuk &rarr;</Link>
      </div>
    );
  }

  const s = data.summary;

  async function handleClose() {
    if (!closing) return;
    const price = Number(exitPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Exit price harus > 0");
      return;
    }
    setBusy(true);
    setError("");
    const res = await closePosition(closing.id, price);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setClosing(null);
    setExitPrice("");
    refresh();
  }

  async function handleDelete(id: number) {
    await deletePosition(id);
    refresh();
  }

  const stats = [
    { label: "Total Investasi", value: formatPrice(s.invested), color: "text-white" },
    { label: "Nilai Pasar", value: formatPrice(s.market_value), color: "text-cyan-400" },
    { label: "Unrealized P&L", value: formatPrice(s.unrealized_pnl), color: pnlClass(s.unrealized_pnl) },
    { label: "Realized P&L", value: formatPrice(s.realized_pnl), color: pnlClass(s.realized_pnl) },
    { label: "Total P&L", value: formatPrice(s.total_pnl), color: pnlClass(s.total_pnl) },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portofolio</h1>
          <p className="text-sm text-white/60">Paper trading — pantau & evaluasi posisi Anda</p>
        </div>
        <Link href="/screener" className="text-sm bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
          + Buka Posisi
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/40 uppercase tracking-wider">{item.label}</div>
            <div className={`font-mono text-lg font-bold mt-1 ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm font-mono ${pnlClass(s.total_pnl)}`}>
        Return Portofolio: {formatPercent(s.total_pnl_percent)} · {s.open_count} posisi terbuka · {s.closed_count} posisi ditutup
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold">Posisi Terbuka</h2>
          <span className="text-xs text-white/40">{s.open_count} posisi</span>
        </div>
        {data.open.length === 0 ? (
          <div className="text-center py-10 text-white/40 text-sm">
            Belum ada posisi terbuka. Buka posisi dari halaman detail saham.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white/40 border-b border-white/5">
                  <th className="px-4 py-3">Saham</th>
                  <th className="px-4 py-3">Side</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Entry</th>
                  <th className="px-4 py-3 text-right">Harga Aktual</th>
                  <th className="px-4 py-3 text-right">P&L</th>
                  <th className="px-4 py-3 text-right">P&L %</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.open.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/stocks/${p.code}`} className="font-medium text-cyan-400 hover:text-cyan-300">{p.code}</Link>
                      <div className="text-xs text-white/40">{p.name}</div>
                    </td>
                    <td className={`px-4 py-3 text-xs font-medium ${p.side === "short" ? "text-red-400" : "text-emerald-400"}`}>{p.side.toUpperCase()}</td>
                    <td className="px-4 py-3 text-right font-mono">{p.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatPrice(p.entry_price)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatPrice(p.current_price)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${pnlClass(p.pnl)}`}>{formatPrice(p.pnl)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${pnlClass(p.pnl_percent)}`}>{formatPercent(p.pnl_percent)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => { setClosing(p); setExitPrice(String(p.current_price)); setError(""); }} className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors mr-2">
                        Tutup
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-white/30 hover:text-red-400 transition-colors">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold">Riwayat Ditutup</h2>
          <span className="text-xs text-white/40">{s.closed_count} transaksi</span>
        </div>
        {data.closed.length === 0 ? (
          <div className="text-center py-10 text-white/40 text-sm">Belum ada transaksi ditutup.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white/40 border-b border-white/5">
                  <th className="px-4 py-3">Saham</th>
                  <th className="px-4 py-3">Side</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Entry</th>
                  <th className="px-4 py-3 text-right">Exit</th>
                  <th className="px-4 py-3 text-right">P&L</th>
                  <th className="px-4 py-3 text-right">P&L %</th>
                  <th className="px-4 py-3">Ditutup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.closed.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium">{t.code}</td>
                    <td className={`px-4 py-3 text-xs font-medium ${t.side === "short" ? "text-red-400" : "text-emerald-400"}`}>{t.side.toUpperCase()}</td>
                    <td className="px-4 py-3 text-right font-mono">{t.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatPrice(t.entry_price)}</td>
                    <td className="px-4 py-3 text-right font-mono">{t.exit_price ? formatPrice(t.exit_price) : "-"}</td>
                    <td className={`px-4 py-3 text-right font-mono ${pnlClass(t.pnl)}`}>{formatPrice(t.pnl)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${pnlClass(t.pnl_percent ?? 0)}`}>{t.pnl_percent != null ? formatPercent(t.pnl_percent) : "-"}</td>
                    <td className="px-4 py-3 text-xs text-white/40">{t.closed_at ? new Date(t.closed_at).toLocaleDateString("id-ID") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!closing} onOpenChange={(open) => { if (!open) setClosing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Posisi {closing?.code}</DialogTitle>
            <DialogDescription>
              Masukkan harga exit untuk menghitung P&L.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-xs text-white/40">Entry</div>
                <div className="font-mono text-sm">{closing ? formatPrice(closing.entry_price) : "-"}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-xs text-white/40">Qty</div>
                <div className="font-mono text-sm">{closing?.quantity}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-xs text-white/40">Harga Aktual</div>
                <div className="font-mono text-sm">{closing ? formatPrice(closing.current_price) : "-"}</div>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Exit Price (Rp)</label>
              <input
                type="number"
                min="1"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono outline-none focus:border-emerald-500/50"
                autoFocus
              />
              {error && <div className="text-xs text-red-400 mt-2">{error}</div>}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setClosing(null)}
                disabled={busy}
                className="text-sm px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleClose}
                disabled={busy}
                className="text-sm bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                {busy ? "Memproses..." : "Tutup Posisi"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
