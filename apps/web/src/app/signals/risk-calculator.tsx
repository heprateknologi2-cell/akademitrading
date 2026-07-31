"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";

export function RiskCalculator() {
  const [capital, setCapital] = useState(10000000);
  const [riskPercent, setRiskPercent] = useState(0.5);
  const [entry, setEntry] = useState(1000);
  const [stop, setStop] = useState(950);
  const [target, setTarget] = useState(1100);
  const result = useMemo(() => {
    const riskPerShare = Math.abs(entry - stop);
    if (capital <= 0 || riskPercent <= 0 || entry <= 0 || stop <= 0 || riskPerShare === 0) return null;
    const maxRisk = capital * riskPercent / 100;
    const lots = Math.floor(Math.floor(maxRisk / riskPerShare) / 100);
    const reward = Math.abs(target - entry);
    return { maxRisk, lots, shares: lots * 100, positionValue: lots * 100 * entry, actualRisk: lots * 100 * riskPerShare, ratio: reward / riskPerShare };
  }, [capital, entry, riskPercent, stop, target]);
  const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

  return <section className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5 sm:p-6" aria-labelledby="risk-calculator-title">
    <div className="flex items-start gap-3"><Calculator className="mt-0.5 size-6 text-emerald-300" /><div><h2 id="risk-calculator-title" className="text-lg font-semibold">Kalkulator ukuran posisi</h2><p className="mt-1 text-sm text-white/50">Batasi kerugian berdasarkan modal dan jarak invalidasi, bukan keyakinan pada sinyal.</p></div></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {[
        ["Modal (Rp)", capital, setCapital], ["Risiko (%)", riskPercent, setRiskPercent], ["Harga entry", entry, setEntry], ["Harga stop", stop, setStop], ["Harga target", target, setTarget],
      ].map(([label, value, setter]) => <label key={String(label)} className="text-sm text-white/60">{String(label)}<Input type="number" min="0" step={label === "Risiko (%)" ? "0.1" : "1"} value={Number(value)} onChange={(event) => (setter as (n: number) => void)(Number(event.target.value))} className="mt-2 h-11 font-mono text-white" /></label>)}
    </div>
    {!result ? <p className="mt-5 text-sm text-red-300" role="alert">Masukkan nilai positif dan pastikan harga entry berbeda dari stop.</p> : <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {[["Risiko maksimum", money(result.maxRisk)], ["Jumlah", `${result.lots} lot`], ["Saham", result.shares.toLocaleString("id-ID")], ["Nilai posisi", money(result.positionValue)], ["Risiko aktual", money(result.actualRisk)], ["Risk : reward", `1 : ${result.ratio.toFixed(2)}`]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-white/40">{label}</p><p className="mt-1 font-mono text-sm font-medium">{value}</p></div>)}
    </div>}
    {result && result.ratio < 2 && <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100" role="status">Risk–reward kurang dari 1:2. Pertimbangkan entry yang lebih baik atau lewatkan transaksi.</p>}
    <p className="mt-4 text-xs leading-5 text-white/40">Batas bawaan pemula: maksimal 0,5% modal per transaksi. Hasil dibulatkan ke bawah per 100 saham dan belum memperhitungkan biaya broker, slippage, atau batas ARA/ARB.</p>
  </section>;
}
