const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface StockItem {
  code: string;
  name: string;
  sector: string;
  price: number;
  change_percent: number;
  volume: number;
  market_cap: string;
  pe: number;
  pbv: number;
  rsi: number;
  macd: string;
  signals: string[];
  composite_score: number;
  composite_direction: string;
}

export interface SignalItem {
  code: string;
  name: string;
  signalType: string;
  direction: string;
  strength: number;
  score: number;
  description: string;
  price: number;
  change_percent: number;
}

export interface ScreenerResponse {
  data: StockItem[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchScreener(params?: Record<string, string>): Promise<ScreenerResponse> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${API_BASE}/api/screener${query}`);
  return res.json();
}

export async function fetchSignals(): Promise<{ data: SignalItem[]; total: number }> {
  const res = await fetch(`${API_BASE}/api/signals/today`);
  return res.json();
}

export async function fetchStockDetail(code: string) {
  const res = await fetch(`${API_BASE}/api/stocks/${code}`);
  return res.json();
}

export async function fetchStocks() {
  const res = await fetch(`${API_BASE}/api/stocks`);
  return res.json();
}

export interface WatchlistItem {
  code: string;
  name: string;
  price: number | null;
  alert_price: number | null;
}

export async function fetchWatchlist(): Promise<{ data: WatchlistItem[] }> {
  const res = await fetch("/api/watchlist");
  return res.json();
}

export async function addToWatchlist(code: string, alertPrice?: number) {
  const res = await fetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, alert_price: alertPrice }),
  });
  return res.json();
}

export async function removeFromWatchlist(code: string) {
  const res = await fetch("/api/watchlist", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return res.json();
}
