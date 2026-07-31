"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarEvent {
  date: string;
  code: string;
  name: string;
  type: "dividend" | "earnings" | "split";
  amount?: number;
  ratio?: string;
}

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [filter, setFilter] = useState("all");
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [selected, setSelected] = useState(dateKey(today.getFullYear(), today.getMonth(), today.getDate()));

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const from = dateKey(year, monthIndex, 1);
  const to = dateKey(year, monthIndex, daysInMonth);

  useEffect(() => {
    const query = new URLSearchParams({ from, to });
    if (filter !== "all") query.set("type", filter);
    fetch(`/api/calendar?${query}`)
      .then((res) => res.json())
      .then((json) => setEvents(json.data || []))
      .catch(() => setEvents([]));
  }, [filter, from, to]);

  const byDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const event of events || []) (grouped[event.date] ||= []).push(event);
    return grouped;
  }, [events]);
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  while (cells.length % 7) cells.push(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kalender Pasar BEI</h1>
          <p className="text-sm text-white/50">Jadwal dividen dan laporan keuangan emiten.</p>
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-white/10 bg-[#020817] px-3 py-2 text-sm">
          <option value="all">Semua Event</option>
          <option value="dividend">Dividen</option>
          <option value="earnings">Laporan Keuangan</option>
        </select>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <button onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5">←</button>
          <h2 className="font-semibold">{month.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</h2>
          <button onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5">→</button>
        </div>
        <div className="grid grid-cols-7 bg-white/5">
          {WEEKDAYS.map((day) => <div key={day} className="p-2 text-center text-xs text-white/40">{day}</div>)}
        </div>
        {!events ? <div className="p-4"><Skeleton className="h-[480px] w-full" /></div> : (
          <div className="grid grid-cols-7">
            {cells.map((day, index) => {
              const key = day ? dateKey(year, monthIndex, day) : "";
              const dayEvents = key ? byDate[key] || [] : [];
              return (
                <button key={index} disabled={!day} onClick={() => day && setSelected(key)} className={`min-h-24 border-t border-r border-white/5 p-2 text-left align-top hover:bg-white/[0.03] ${selected === key ? "bg-white/5 ring-1 ring-inset ring-emerald-500/40" : ""}`}>
                  {day && <span className="text-xs text-white/60">{day}</span>}
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <div key={`${event.code}-${event.type}-${eventIndex}`} className={`truncate rounded px-1.5 py-0.5 text-[10px] ${event.type === "dividend" ? "bg-emerald-500/20 text-emerald-400" : event.type === "earnings" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>{event.code} · {event.type === "dividend" ? "Dividen" : event.type === "earnings" ? "Laporan" : "Split"}</div>
                    ))}
                    {dayEvents.length > 3 && <div className="text-[10px] text-white/40">+{dayEvents.length - 3} event</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 p-5">
        <h2 className="font-semibold">Event {new Date(`${selected}T00:00:00`).toLocaleDateString("id-ID", { dateStyle: "long" })}</h2>
        <div className="mt-3 divide-y divide-white/5">
          {(byDate[selected] || []).length === 0 ? <div className="py-6 text-sm text-white/40">Tidak ada event pada tanggal ini.</div> : byDate[selected].map((event, index) => (
            <div key={`${event.code}-${event.type}-${index}`} className="flex items-center justify-between py-3">
              <div><Link href={`/stocks/${event.code}`} className="font-medium text-emerald-400">{event.code}</Link><div className="text-xs text-white/40">{event.name}</div></div>
              <div className="text-right"><div className={event.type === "dividend" ? "text-emerald-400" : "text-blue-400"}>{event.type === "dividend" ? "Dividen" : event.type === "earnings" ? "Laporan Keuangan" : "Stock Split"}</div>{event.amount != null && <div className="text-xs">Rp{event.amount.toLocaleString("id-ID")}/saham</div>}{event.ratio && <div className="text-xs">Rasio {event.ratio}</div>}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
