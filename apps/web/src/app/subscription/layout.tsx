import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Langganan PRO",
  description: "Upgrade ke akademitrading PRO untuk akses screener penuh, sinyal harian, notifikasi Telegram, backtest, dan price alert.",
  openGraph: {
    title: "Langganan PRO — Akademitrading",
    description: "Akses penuh screener, sinyal, backtest, dan notifikasi Telegram.",
  },
};

export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
