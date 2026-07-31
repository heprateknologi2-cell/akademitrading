"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Time } from "lightweight-charts";
import { Bar, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Candle } from "@/lib/api";

interface StockChartProps {
  candles: Candle[];
  compareCandles?: Candle[];
  compareLabel?: string;
  normalize?: boolean;
  height?: number;
}

function ema(values: number[], period: number) {
  if (values.length === 0) return [];
  const multiplier = 2 / (period + 1);
  const result = [values[0]];
  for (let i = 1; i < values.length; i++) result.push(values[i] * multiplier + result[i - 1] * (1 - multiplier));
  return result;
}

function rsi(values: number[], period = 14) {
  const result: Array<number | null> = Array(values.length).fill(null);
  if (values.length <= period) return result;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    gain += Math.max(change, 0);
    loss += Math.max(-change, 0);
  }
  let averageGain = gain / period;
  let averageLoss = loss / period;
  result[period] = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);
  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
    result[i] = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);
  }
  return result;
}

export function StockChart({ candles, compareCandles, compareLabel, normalize = false, height = 420 }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicators = useMemo(() => {
    const closes = candles.map(c => c.close);
    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);
    const signal = ema(ema12.map((value, i) => value - ema26[i]), 9);
    const rsi14 = rsi(closes);
    return candles.map((c, i) => {
      const macd = ema12[i] - ema26[i];
      return {
        date: c.date.slice(0, 10),
        label: new Date(c.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        rsi: rsi14[i],
        macd,
        signal: signal[i],
        histogram: macd - signal[i],
      };
    });
  }, [candles]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || candles.length === 0) return;

    let chart: Awaited<ReturnType<typeof import("lightweight-charts").createChart>> | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;

    async function init(container: HTMLDivElement) {
      const { createChart, CandlestickSeries, LineSeries, ColorType } = await import("lightweight-charts");
      if (cancelled) return;

      const primaryBase = normalize ? candles[0]?.close || 1 : 1;
      const normalizeValue = (value: number) => normalize ? value / primaryBase * 100 : value;
      const candlestickData = candles.map(c => ({
        time: c.date.slice(0, 10) as Time,
        open: normalizeValue(c.open),
        high: normalizeValue(c.high),
        low: normalizeValue(c.low),
        close: normalizeValue(c.close),
      }));
      const smaData = (key: "sma_20" | "sma_50" | "sma_200") =>
        candles.filter(c => c[key] != null).map(c => ({ time: c.date.slice(0, 10) as Time, value: normalizeValue(c[key] as number) }));
      const bbData = (key: "bb_upper" | "bb_lower") =>
        candles.filter(c => c[key] != null).map(c => ({ time: c.date.slice(0, 10) as Time, value: normalizeValue(c[key] as number) }));

      chart = createChart(container, {
        height,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#8b93a7",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.04)" },
        },
        crosshair: {
          mode: 0,
          vertLine: { color: "#3b4252", width: 1, style: 3 },
          horzLine: { color: "#3b4252", width: 1, style: 3 },
        },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
        timeScale: { borderColor: "rgba(255,255,255,0.08)", rightOffset: 3, barSpacing: 8 },
        localization: {
          priceFormatter: (p: number) => normalize ? `${p.toFixed(2)}` : `Rp${p.toLocaleString("id-ID")}`,
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      });
      candleSeries.setData(candlestickData);

      const sma20 = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const sma50 = chart.addSeries(LineSeries, { color: "#3b82f6", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const sma200 = chart.addSeries(LineSeries, { color: "#a855f7", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const ema20 = chart.addSeries(LineSeries, { color: "#22d3ee", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const bbUpper = chart.addSeries(LineSeries, { color: "rgba(125,211,252,0.4)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
      const bbLower = chart.addSeries(LineSeries, { color: "rgba(125,211,252,0.4)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

      if (smaData("sma_20").length > 0) sma20.setData(smaData("sma_20"));
      if (smaData("sma_50").length > 0) sma50.setData(smaData("sma_50"));
      if (smaData("sma_200").length > 0) sma200.setData(smaData("sma_200"));
      const ema20Values = ema(candles.map(c => c.close), 20);
      ema20.setData(candles.map((c, i) => ({ time: c.date.slice(0, 10) as Time, value: normalizeValue(ema20Values[i]) })));
      if (bbData("bb_upper").length > 0) bbUpper.setData(bbData("bb_upper"));
      if (bbData("bb_lower").length > 0) bbLower.setData(bbData("bb_lower"));

      if (compareCandles?.length) {
        const compareBase = compareCandles[0].close || 1;
        const compareSeries = chart.addSeries(LineSeries, {
          color: "#f59e0b",
          lineWidth: 2,
          priceLineVisible: false,
          title: compareLabel || "Pembanding",
        });
        compareSeries.setData(compareCandles.map((c) => ({
          time: c.date.slice(0, 10) as Time,
          value: normalize ? c.close / compareBase * 100 : c.close,
        })));
      }

      chart.timeScale().fitContent();

      resizeObserver = new ResizeObserver(() => {
        if (container.clientWidth > 0) chart?.applyOptions({ width: container.clientWidth });
      });
      resizeObserver.observe(container);
    }

    init(container).catch(() => {});

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      chart?.remove();
    };
  }, [candles, compareCandles, compareLabel, normalize, height]);

  if (candles.length === 0) {
    return <div className="flex items-center justify-center h-64 text-white/40 text-sm">Data historis tidak tersedia</div>;
  }

  const tooltipStyle = { background: "#020817", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 11 };

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="w-full" style={{ height }} />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/10 p-2">
          <div className="px-2 pb-1 text-[11px] font-medium text-white/50">RSI (14)</div>
          <ResponsiveContainer width="100%" height={145}>
            <ComposedChart data={indicators} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 9 }} minTickGap={35} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} ticks={[30, 50, 70]} tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#9ca3af" }} formatter={(value) => [Number(value).toFixed(2), "RSI"]} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.55} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.55} />
              <Line type="monotone" dataKey="rsi" stroke="#f59e0b" dot={false} strokeWidth={1.5} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/10 p-2">
          <div className="flex gap-3 px-2 pb-1 text-[11px] font-medium text-white/50">
            <span>MACD (12, 26, 9)</span><span className="text-blue-400">MACD</span><span className="text-amber-400">Signal</span>
          </div>
          <ResponsiveContainer width="100%" height={145}>
            <ComposedChart data={indicators} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 9 }} minTickGap={35} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} width={42} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#9ca3af" }} formatter={(value, name) => [Number(value).toFixed(2), name]} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,.2)" />
              <Bar dataKey="histogram" name="Histogram" fill="#10b981" opacity={0.45} />
              <Line type="monotone" dataKey="macd" name="MACD" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="signal" name="Signal" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
