import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backtest Strategi — Akademitrading",
  description: "Uji strategi trading (SMA crossover, RSI) pada data historis saham Indonesia. Analisis performa, win rate, dan drawdown.",
  openGraph: {
    title: "Backtest Strategi Trading — Akademitrading",
    description: "Simulasi strategi trading pada data historis saham IDX.",
  },
};

export default function BacktestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
