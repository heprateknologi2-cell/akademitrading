export const SECTORS = [
  "Financials", "Consumer Cyclicals", "Consumer Non-Cyclicals",
  "Infrastructure", "Energy", "Basic Materials", "Industrials",
  "Healthcare", "Technology", "Property & Real Estate",
  "Transportation & Logistics", "Investment Services",
] as const;
export type Sector = typeof SECTORS[number];

export const MARKET_CAPS = ["Large Cap", "Mid Cap", "Small Cap"] as const;
export type MarketCap = typeof MARKET_CAPS[number];

export const SIGNAL_TYPES = [
  "golden_cross", "death_cross", "rsi_oversold", "rsi_overbought",
  "macd_bullish", "macd_bearish", "volume_spike", "breakout",
  "support_bounce", "bandarmology", "foreign_flow", "composite",
] as const;
export type SignalType = typeof SIGNAL_TYPES[number];

export const TIERS = ["free", "pro", "enterprise"] as const;
export type Tier = typeof TIERS[number];

export interface StockSummary {
  code: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  pe: number;
  pbv: number;
  rsi: number;
  macd: string;
  signal: string[];
}

export interface ScreenerFilter {
  sectors?: string[];
  marketCaps?: string[];
  minPrice?: number;
  maxPrice?: number;
  minChange?: number;
  maxChange?: number;
  minVolume?: number;
  maxVolume?: number;
  minPE?: number;
  maxPE?: number;
  minPBV?: number;
  maxPBV?: number;
  rsi?: "oversold" | "overbought" | "neutral";
  macd?: "bullish" | "bearish";
  signalTypes?: SignalType[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SignalResult {
  code: string;
  name: string;
  signalType: SignalType;
  direction: "buy" | "sell" | "neutral";
  strength: number;
  price: number;
  changePercent: number;
  description: string;
}

export interface StockDetail {
  code: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: string;
  pe: number;
  pbv: number;
  eps: number;
  roe: number;
  der: number;
  dividendYield: number;
  indicators: {
    rsi: number;
    macd: number;
    macdSignal: number;
    macdHist: number;
    sma20: number;
    sma50: number;
    sma200: number;
    bbUpper: number;
    bbLower: number;
    bbMiddle: number;
    atr: number;
  };
  signals: SignalResult[];
}
