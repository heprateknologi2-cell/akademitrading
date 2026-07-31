import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db, positions } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id || session.user.email || "";

  let rows;
  try {
    rows = await db.select().from(positions).where(eq(positions.userId, userId)).orderBy(desc(positions.openedAt));
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  const open = rows.filter(r => r.status === "open");
  const closed = rows.filter(r => r.status === "closed");

  let prices: Record<string, { price: number; change_percent: number }> = {};
  if (open.length > 0) {
    try {
      const res = await fetch(`${API_BASE}/api/stocks/prices?codes=${open.map(r => r.code).join(",")}`, { next: { revalidate: 30 } });
      prices = (await res.json()).data || {};
    } catch {
      prices = {};
    }
  }

  const openPositions = open.map(r => {
    const entry = num(r.entryPrice);
    const qty = num(r.quantity);
    const current = prices[r.code]?.price ?? entry;
    const isLong = r.side !== "short";
    const pnl = (isLong ? current - entry : entry - current) * qty;
    const pnlPercent = entry > 0 ? (pnl / (entry * qty)) * 100 : 0;
    const invested = entry * qty;
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      side: r.side,
      quantity: qty,
      entry_price: entry,
      current_price: current,
      stop_loss: r.stopLoss ? num(r.stopLoss) : null,
      take_profit: r.takeProfit ? num(r.takeProfit) : null,
      pnl,
      pnl_percent: pnlPercent,
      invested,
      opened_at: r.openedAt,
      notes: r.notes,
    };
  });

  const realized = closed.reduce((sum, r) => sum + num(r.pnl), 0);
  const unrealized = openPositions.reduce((sum, r) => sum + r.pnl, 0);
  const invested = openPositions.reduce((sum, r) => sum + r.invested, 0);

  return NextResponse.json({
    data: {
      summary: {
        invested,
        market_value: invested + unrealized,
        unrealized_pnl: unrealized,
        realized_pnl: realized,
        total_pnl: unrealized + realized,
        total_pnl_percent: invested > 0 ? ((unrealized + realized) / invested) * 100 : 0,
        open_count: openPositions.length,
        closed_count: closed.length,
      },
      open: openPositions,
      closed: closed.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        side: r.side,
        quantity: num(r.quantity),
        entry_price: num(r.entryPrice),
        exit_price: r.exitPrice ? num(r.exitPrice) : null,
        pnl: num(r.pnl),
        pnl_percent: r.pnlPercent ? num(r.pnlPercent) : null,
        opened_at: r.openedAt,
        closed_at: r.closedAt,
      })),
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id || session.user.email || "";

  const { code, name, quantity, entry_price, stop_loss, take_profit, side, notes } = await req.json();
  if (!code || !quantity || !entry_price) {
    return NextResponse.json({ error: "code, quantity, entry_price required" }, { status: 400 });
  }
  if (Number(quantity) <= 0 || Number(entry_price) <= 0) {
    return NextResponse.json({ error: "quantity dan entry price harus > 0" }, { status: 400 });
  }

  try {
    const [row] = await db
      .insert(positions)
      .values({
        userId,
        code: code.toUpperCase(),
        name,
        side: side === "short" ? "short" : "long",
        quantity: Math.round(Number(quantity)),
        entryPrice: String(entry_price),
        stopLoss: stop_loss ? String(stop_loss) : null,
        takeProfit: take_profit ? String(take_profit) : null,
        notes,
      })
      .returning();
    return NextResponse.json({ data: row }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}
