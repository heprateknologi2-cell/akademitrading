import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sinyal Trading",
  description: "Sinyal trading saham Indonesia: golden cross, death cross, RSI, MACD, breakout, dan bandarmology. Update real-time untuk saham IDX.",
  openGraph: {
    title: "Sinyal Trading Saham — Akademitrading",
    description: "Sinyal trading saham Indonesia real-time dengan analisis teknikal & bandarmology.",
  },
};

export default function SignalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
