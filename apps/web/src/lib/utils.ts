import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function signalColor(type: string): string {
  if (["golden_cross", "macd_bullish", "support_bounce"].includes(type)) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (["death_cross", "rsi_overbought", "macd_bearish"].includes(type)) return "bg-red-500/20 text-red-400 border-red-500/30";
  if (["volume_spike"].includes(type)) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (["rsi_oversold"].includes(type)) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (["breakout"].includes(type)) return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

export function signalLabel(type: string): string {
  const labels: Record<string, string> = {
    golden_cross: "Golden Cross",
    death_cross: "Death Cross",
    rsi_oversold: "RSI Oversold",
    rsi_overbought: "RSI Overbought",
    macd_bullish: "MACD Bullish",
    macd_bearish: "MACD Bearish",
    volume_spike: "Volume Spike",
    breakout: "Breakout",
    support_bounce: "Support Bounce",
    bandarmology: "Bandarmology",
    foreign_flow: "Foreign Flow",
    composite: "Composite",
  };
  return labels[type] || type;
}
