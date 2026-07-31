async function jfetch<T = unknown>(input: string, init?: RequestInit): Promise<T> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(15000) }).then(r => r.json());
}

export interface ApiResult<T = unknown> {
  data?: T;
  error?: string;
}

export interface StockItem {
  code: string;
  name: string;
  sector: string;
  price: number;
  change_percent: number;
  volume: number;
  avg_volume_20: number;
  avg_value_20: number;
  market_cap: string;
  pe: number;
  pbv: number;
  dividend_yield: number;
  rsi: number;
  atr: number;
  atr_percent: number;
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
  indicator_score?: number;
  category?: "primary" | "watchlist";
  components?: Record<"trend" | "momentum" | "setup" | "volume" | "relative_strength" | "liquidity", number>;
  atr?: number;
  stop_loss?: number;
  take_profit?: number;
}

export interface ScreenerResponse {
  data: StockItem[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchScreener(params?: Record<string, string>): Promise<ScreenerResponse> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return jfetch(`/api/screener${query}`);
}

export async function fetchSignals(): Promise<{ data: SignalItem[]; total: number }> {
  return jfetch("/api/signals");
}

export async function fetchStockDetail(code: string): Promise<{ data: unknown }> {
  return jfetch(`/api/stocks/${encodeURIComponent(code)}`);
}

export interface StockSearchItem {
  code: string;
  name: string;
  sector?: string;
}

export async function fetchStocks(search?: string): Promise<{ data: StockSearchItem[] }> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return jfetch(`/api/stocks${query}`);
}

export interface WatchlistItem {
  id: number;
  code: string;
  name: string;
  price: number | null;
  change_percent: number;
  alert_price: number | null;
  alert_status: "none" | "below" | "above";
  notes: string | null;
}

export async function fetchWatchlist(): Promise<{ data: WatchlistItem[] }> {
  return jfetch("/api/watchlist");
}

export async function addToWatchlist(code: string, alertPrice?: number, name?: string): Promise<ApiResult> {
  return jfetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, alert_price: alertPrice, name }),
  });
}

export async function removeFromWatchlist(code: string): Promise<ApiResult> {
  return jfetch("/api/watchlist", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma_20: number | null;
  sma_50: number | null;
  sma_200: number | null;
  bb_upper: number | null;
  bb_lower: number | null;
}

export async function fetchStockHistory(code: string, range = "6mo"): Promise<{ data: Candle[] }> {
  return jfetch(`/api/stocks/${encodeURIComponent(code)}/history?range=${encodeURIComponent(range)}`);
}

export interface MarketOverview {
  ihsg: { name: string; price: number; change_percent: number; volume: number };
  breadth: { advancers: number; decliners: number; unchanged: number; total: number };
  top_gainers: StockItem[];
  top_losers: StockItem[];
  most_active: StockItem[];
}

export async function fetchMarketOverview(): Promise<{ data: MarketOverview }> {
  return jfetch("/api/market/overview");
}

export interface Position {
  id: number;
  code: string;
  name: string | null;
  side: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  pnl: number;
  pnl_percent: number;
  invested: number;
  opened_at: string;
  notes: string | null;
}

export interface ClosedTrade {
  id: number;
  code: string;
  name: string | null;
  side: string;
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  pnl: number;
  pnl_percent: number | null;
  opened_at: string;
  closed_at: string | null;
}

export interface PortfolioData {
  summary: {
    invested: number;
    market_value: number;
    unrealized_pnl: number;
    realized_pnl: number;
    total_pnl: number;
    total_pnl_percent: number;
    open_count: number;
    closed_count: number;
  };
  open: Position[];
  closed: ClosedTrade[];
}

export async function fetchPortfolio(): Promise<{ data: PortfolioData }> {
  return jfetch("/api/portfolio");
}

export async function openPosition(payload: {
  code: string;
  name?: string;
  quantity: number;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  side?: string;
  notes?: string;
}): Promise<ApiResult> {
  return jfetch("/api/portfolio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function closePosition(id: number, exitPrice: number): Promise<ApiResult> {
  return jfetch(`/api/portfolio/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exit_price: exitPrice }),
  });
}

export async function updatePosition(id: number, patch: { stop_loss?: number; take_profit?: number }): Promise<ApiResult> {
  return jfetch(`/api/portfolio/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deletePosition(id: number): Promise<ApiResult> {
  return jfetch(`/api/portfolio/${id}`, { method: "DELETE" });
}
