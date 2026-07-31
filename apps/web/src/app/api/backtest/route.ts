import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma_20: number | null;
  sma_50: number | null;
  sma_200: number | null;
}

interface Trade {
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  pnlPercent: number;
  holdDays: number;
}

interface BacktestResult {
  code: string;
  strategy: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  maxDrawdown: number;
  avgHoldDays: number;
  bestTrade: number;
  worstTrade: number;
  trades: Trade[];
}

function smaCrossover(candles: Candle[], fast: number, slow: number): Trade[] {
  const trades: Trade[] = [];
  let position: { entryIdx: number; entryPrice: number; entryDate: string } | null = null;

  const fastKey = `sma_${fast}` as keyof Candle;
  const slowKey = `sma_${slow}` as keyof Candle;

  for (let i = 1; i < candles.length; i++) {
    const prevFast = candles[i - 1][fastKey] as number | null;
    const prevSlow = candles[i - 1][slowKey] as number | null;
    const currFast = candles[i][fastKey] as number | null;
    const currSlow = candles[i][slowKey] as number | null;

    if (prevFast == null || prevSlow == null || currFast == null || currSlow == null) continue;

    const bullishCross = prevFast <= prevSlow && currFast > currSlow;
    const bearishCross = prevFast >= prevSlow && currFast < currSlow;

    if (bullishCross && !position) {
      position = { entryIdx: i, entryPrice: candles[i].close, entryDate: candles[i].date };
    } else if (bearishCross && position) {
      const exitPrice = candles[i].close;
      const pnlPercent = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
      const holdDays = Math.max(1, Math.round((new Date(candles[i].date).getTime() - new Date(position.entryDate).getTime()) / (1000 * 60 * 60 * 24)));
      trades.push({
        entryDate: position.entryDate,
        entryPrice: position.entryPrice,
        exitDate: candles[i].date,
        exitPrice,
        pnlPercent,
        holdDays,
      });
      position = null;
    }
  }

  if (position) {
    const last = candles[candles.length - 1];
    const pnlPercent = ((last.close - position.entryPrice) / position.entryPrice) * 100;
    const holdDays = Math.max(1, Math.round((new Date(last.date).getTime() - new Date(position.entryDate).getTime()) / (1000 * 60 * 60 * 24)));
    trades.push({
      entryDate: position.entryDate,
      entryPrice: position.entryPrice,
      exitDate: last.date,
      exitPrice: last.close,
      pnlPercent,
      holdDays,
    });
  }

  return trades;
}

function rsiStrategy(candles: Candle[], period: number, oversold: number, overbought: number): Trade[] {
  const trades: Trade[] = [];
  let position: { entryPrice: number; entryDate: string } | null = null;

  const rsi: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      rsi.push(NaN);
      continue;
    }
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const change = candles[j].close - candles[j - 1].close;
      if (change >= 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }

  for (let i = period + 1; i < candles.length; i++) {
    if (rsi[i] < oversold && !position) {
      position = { entryPrice: candles[i].close, entryDate: candles[i].date };
    } else if (rsi[i] > overbought && position) {
      const pnlPercent = ((candles[i].close - position.entryPrice) / position.entryPrice) * 100;
      const holdDays = Math.max(1, Math.round((new Date(candles[i].date).getTime() - new Date(position.entryDate).getTime()) / (1000 * 60 * 60 * 24)));
      trades.push({
        entryDate: position.entryDate,
        entryPrice: position.entryPrice,
        exitDate: candles[i].date,
        exitPrice: candles[i].close,
        pnlPercent,
        holdDays,
      });
      position = null;
    }
  }

  if (position) {
    const last = candles[candles.length - 1];
    const pnlPercent = ((last.close - position.entryPrice) / position.entryPrice) * 100;
    const holdDays = Math.max(1, Math.round((new Date(last.date).getTime() - new Date(position.entryDate).getTime()) / (1000 * 60 * 60 * 24)));
    trades.push({
      entryDate: position.entryDate,
      entryPrice: position.entryPrice,
      exitDate: last.date,
      exitPrice: last.close,
      pnlPercent,
      holdDays,
    });
  }

  return trades;
}

function computeStats(candles: Candle[], trades: Trade[], initialCapital: number, strategy: string, code: string): BacktestResult {
  let finalValue = initialCapital;
  const equityCurve: number[] = [initialCapital];
  let peak = initialCapital;
  let maxDrawdown = 0;

  for (const trade of trades) {
    const tradeReturn = trade.pnlPercent / 100;
    finalValue *= (1 + tradeReturn);
    equityCurve.push(finalValue);
    if (finalValue > peak) peak = finalValue;
    const dd = (peak - finalValue) / peak * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const winTrades = trades.filter(t => t.pnlPercent > 0).length;
  const lossTrades = trades.filter(t => t.pnlPercent <= 0).length;
  const pnlPercents = trades.map(t => t.pnlPercent);

  return {
    code,
    strategy,
    startDate: candles[0]?.date || "",
    endDate: candles[candles.length - 1]?.date || "",
    initialCapital,
    finalValue,
    totalReturn: finalValue - initialCapital,
    totalReturnPercent: ((finalValue - initialCapital) / initialCapital) * 100,
    totalTrades: trades.length,
    winTrades,
    lossTrades,
    winRate: trades.length > 0 ? (winTrades / trades.length) * 100 : 0,
    maxDrawdown,
    avgHoldDays: trades.length > 0 ? Math.round(trades.reduce((s, t) => s + t.holdDays, 0) / trades.length) : 0,
    bestTrade: pnlPercents.length > 0 ? Math.max(...pnlPercents) : 0,
    worstTrade: pnlPercents.length > 0 ? Math.min(...pnlPercents) : 0,
    trades,
  };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.tier !== "pro") {
    return NextResponse.json({ error: "Backtest tersedia untuk PRO member" }, { status: 403 });
  }

  const limited = rateLimit(`backtest:${session.user.id}`, 10);
  if (limited) return limited;

  const { code, strategy, period, capital } = await req.json().catch(() => ({}));
  if (!code) {
    return NextResponse.json({ error: "Kode saham wajib diisi" }, { status: 400 });
  }

  const range = period === "1y" ? "1y" : period === "3y" ? "3y" : "6mo";
  const initialCapital = Number(capital) || 10000000;

  try {
    const res = await fetch(`${API_BASE}/api/stocks/${encodeURIComponent(code)}/history?range=${range}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Data saham tidak tersedia" }, { status: 404 });
    }
    const historyData = await res.json();
    const candles: Candle[] = historyData.data || [];

    if (candles.length < 60) {
      return NextResponse.json({ error: "Data historis tidak cukup untuk backtest" }, { status: 400 });
    }

    let trades: Trade[];
    let strategyLabel: string;

    switch (strategy) {
      case "sma_20_50":
        trades = smaCrossover(candles, 20, 50);
        strategyLabel = "SMA 20/50 Crossover";
        break;
      case "sma_50_200":
        trades = smaCrossover(candles, 50, 200);
        strategyLabel = "SMA 50/200 Crossover";
        break;
      case "rsi":
        trades = rsiStrategy(candles, 14, 30, 70);
        strategyLabel = "RSI (14) Oversold/Overbought";
        break;
      default:
        trades = smaCrossover(candles, 20, 50);
        strategyLabel = "SMA 20/50 Crossover";
    }

    const result = computeStats(candles, trades, initialCapital, strategyLabel, code.toUpperCase());
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[Backtest] Error:", error);
    return NextResponse.json({ error: "Backtest gagal dijalankan" }, { status: 500 });
  }
}
