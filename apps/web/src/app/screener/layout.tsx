import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Screener Saham — Akademitrading",
  description: "Screener saham Indonesia real-time dengan filter RSI, MACD, sinyal golden cross, dan sektor. Analisis teknikal otomatis untuk saham IDX.",
  openGraph: {
    title: "Screener Saham Indonesia — Akademitrading",
    description: "Screening saham IDX dengan filter teknikal & fundamental.",
  },
};

export default function ScreenerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
