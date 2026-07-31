"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface HeatmapTicker {
  code: string;
  name: string;
  price: number;
  change_percent: number;
  market_cap: number;
}

interface HeatmapSector {
  sector: string;
  avg_change: number;
  market_cap: number;
  count: number;
  tickers: HeatmapTicker[];
}

interface CellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  change?: number;
}

function heatColor(change = 0) {
  const strength = Math.min(Math.abs(change) / 5, 1);
  if (change > 0) return `rgba(16, 185, 129, ${0.35 + strength * 0.55})`;
  if (change < 0) return `rgba(239, 68, 68, ${0.35 + strength * 0.55})`;
  return "rgba(107, 114, 128, 0.65)";
}

function HeatCell({ x = 0, y = 0, width = 0, height = 0, name = "", change = 0 }: CellProps) {
  if (width < 2 || height < 2) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={heatColor(change)} stroke="#020817" strokeWidth={2} rx={4} />
      {width > 48 && height > 30 && (
        <>
          <text x={x + 7} y={y + 17} fill="white" fontSize={12} fontWeight={700}>{name}</text>
          <text x={x + 7} y={y + 33} fill="rgba(255,255,255,.8)" fontSize={10}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</text>
        </>
      )}
    </g>
  );
}

export default function HeatmapPage() {
  const router = useRouter();
  const [sectors, setSectors] = useState<HeatmapSector[] | null>(null);
  const [view, setView] = useState<"sector" | "market-cap">("market-cap");

  useEffect(() => {
    fetch("/api/market/heatmap")
      .then((res) => res.json())
      .then((json) => setSectors(json.data || []))
      .catch(() => setSectors([]));
  }, []);

  const chartData = useMemo(() => {
    if (!sectors) return [];
    if (view === "sector") {
      return sectors.map((sector) => ({
        name: sector.sector,
        size: Math.max(sector.market_cap, 1),
        change: sector.avg_change,
        sector: sector.sector,
      }));
    }
    return sectors.flatMap((sector) => sector.tickers.map((ticker) => ({
      ...ticker,
      name: ticker.code,
      companyName: ticker.name,
      size: Math.max(ticker.market_cap, 1),
      change: ticker.change_percent,
      sector: sector.sector,
    })));
  }, [sectors, view]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Heatmap Pasar BEI</h1>
          <p className="text-sm text-white/50">Ukuran berdasarkan kapitalisasi pasar, warna berdasarkan perubahan harga.</p>
        </div>
        <div className="flex rounded-lg border border-white/10 p-1">
          <button onClick={() => setView("sector")} className={`px-3 py-1.5 text-sm rounded-md ${view === "sector" ? "bg-white/10 text-white" : "text-white/50"}`}>Per Sektor</button>
          <button onClick={() => setView("market-cap")} className={`px-3 py-1.5 text-sm rounded-md ${view === "market-cap" ? "bg-white/10 text-white" : "text-white/50"}`}>Per Saham</button>
        </div>
      </div>

      <div className="h-[650px] rounded-xl border border-white/10 bg-white/[0.02] p-2">
        {!sectors ? <Skeleton className="h-full w-full" /> : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/40">Data heatmap tidak tersedia</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={chartData}
              dataKey="size"
              nameKey="name"
              content={<HeatCell />}
              onClick={(item) => {
                const code = (item as { code?: string }).code;
                if (code) router.push(`/stocks/${code}`);
              }}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const item = payload[0].payload as { code?: string; name: string; companyName?: string; sector: string; change: number; price?: number };
                  return (
                    <div className="rounded-lg border border-white/10 bg-[#020817] p-3 text-sm shadow-xl">
                      <div className="font-bold">{item.code || item.name}</div>
                      <div className="text-white/50">{item.sector}</div>
                      {item.companyName && <div>{item.companyName}</div>}
                      <div className={item.change >= 0 ? "text-emerald-400" : "text-red-400"}>{item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%</div>
                      {item.price != null && <div className="font-mono">Rp{item.price.toLocaleString("id-ID")}</div>}
                    </div>
                  );
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
