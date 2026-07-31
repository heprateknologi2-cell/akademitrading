"use client";

import { useEffect, useRef } from "react";
import type { Time } from "lightweight-charts";
import type { Candle } from "@/lib/api";

interface StockChartProps {
  candles: Candle[];
  compareCandles?: Candle[];
  compareLabel?: string;
  normalize?: boolean;
  height?: number;
}

export function StockChart({ candles, compareCandles, compareLabel, normalize = false, height = 420 }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      const bbUpper = chart.addSeries(LineSeries, { color: "rgba(125,211,252,0.4)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
      const bbLower = chart.addSeries(LineSeries, { color: "rgba(125,211,252,0.4)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });

      if (smaData("sma_20").length > 0) sma20.setData(smaData("sma_20"));
      if (smaData("sma_50").length > 0) sma50.setData(smaData("sma_50"));
      if (smaData("sma_200").length > 0) sma200.setData(smaData("sma_200"));
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

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
