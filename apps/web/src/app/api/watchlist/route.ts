import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db, watchlists } from "@/lib/db";
import { and, eq } from "drizzle-orm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id || session.user.email || "";

  let rows;
  try {
    rows = await db.select().from(watchlists).where(eq(watchlists.userId, userId));
  } catch {
    return NextResponse.json({ data: [] });
  }

  const codes = rows.map(r => r.stockCode);
  let prices: Record<string, { price: number; change_percent: number }> = {};
  if (codes.length > 0) {
    try {
      const res = await fetch(`${API_BASE}/api/stocks/prices?codes=${codes.join(",")}`, { next: { revalidate: 30 } });
      prices = (await res.json()).data || {};
    } catch {
      prices = {};
    }
  }

  const data = rows.map(r => {
    const live = prices[r.stockCode];
    const alertPrice = r.alertPrice ? Number(r.alertPrice) : null;
    const price = live?.price ?? null;
    let alertStatus: "none" | "below" | "above" = "none";
    if (alertPrice && price) {
      if (price <= alertPrice) alertStatus = "below";
      else alertStatus = "above";
    }
    return {
      id: r.id,
      code: r.stockCode,
      name: r.stockName || r.stockCode,
      price,
      change_percent: live?.change_percent ?? 0,
      alert_price: alertPrice,
      alert_status: alertStatus,
      notes: r.notes,
      created_at: r.createdAt,
    };
  });

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id || session.user.email || "";

  const { code, name, alert_price, notes } = await req.json();
  if (!code) return NextResponse.json({ error: "Stock code required" }, { status: 400 });

  try {
    await db
      .insert(watchlists)
      .values({ userId, stockCode: code.toUpperCase(), stockName: name, alertPrice: alert_price ? String(alert_price) : null, notes })
      .onConflictDoUpdate({
        target: [watchlists.userId, watchlists.stockCode],
        set: {
          alertPrice: alert_price ? String(alert_price) : null,
          stockName: name,
          notes,
        },
      });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  return NextResponse.json({ data: { code: code.toUpperCase(), alert_price, added: true } });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id || session.user.email || "";

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Stock code required" }, { status: 400 });

  try {
    await db.delete(watchlists).where(and(eq(watchlists.userId, userId), eq(watchlists.stockCode, code.toUpperCase())));
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  return NextResponse.json({ data: { code, removed: true } });
}
