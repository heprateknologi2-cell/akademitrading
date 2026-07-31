import { auth } from "@/lib/auth";
import { db, dividends, positions } from "@/lib/db";
import { and, eq, gte, lt } from "drizzle-orm";
import { NextResponse } from "next/server";

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year") || new Date().getFullYear());
  const hasNpwp = url.searchParams.get("npwp") !== "false";
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return NextResponse.json({ error: "Tahun tidak valid" }, { status: 400 });
  const userId = session.user.id || session.user.email || "";
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  try {
    const trades = await db.select().from(positions).where(and(eq(positions.userId, userId), eq(positions.status, "closed"), gte(positions.closedAt, start), lt(positions.closedAt, end)));
    const allPositions = await db.select().from(positions).where(eq(positions.userId, userId));
    const dividendRows = await db.select().from(dividends).where(and(gte(dividends.exDate, start), lt(dividends.exDate, end)));
    const received = dividendRows.flatMap((dividend) => allPositions.filter((position) => position.code === dividend.code && position.openedAt && position.openedAt <= dividend.exDate && (!position.closedAt || position.closedAt >= dividend.exDate)).map((position) => ({ dividend, position })));

    const normalizedTrades = trades.map((trade) => {
      const sellValue = number(trade.exitPrice) * trade.quantity * 100;
      return { id: trade.id, code: trade.code, closed_at: trade.closedAt?.toISOString(), quantity: trade.quantity, entry_price: number(trade.entryPrice), exit_price: number(trade.exitPrice), sell_value: sellValue, realized_pnl: number(trade.pnl), tax: sellValue * 0.001 };
    });
    const realizedPnl = normalizedTrades.reduce((sum, trade) => sum + trade.realized_pnl, 0);
    const finalTaxStock = normalizedTrades.reduce((sum, trade) => sum + trade.tax, 0);
    const dividendDetails = received.map(({ dividend, position }) => ({ code: dividend.code, ex_date: dividend.exDate.toISOString(), quantity: position.quantity, amount_per_share: number(dividend.amountPerShare), amount: position.quantity * 100 * number(dividend.amountPerShare) }));
    const dividendsReceived = dividendDetails.reduce((sum, item) => sum + item.amount, 0);
    const dividendRate = hasNpwp ? (dividendsReceived > 10_000_000 ? 0.1 : 0) : 0.2;
    const finalTaxDividend = dividendsReceived * dividendRate;

    return NextResponse.json({ data: { year, has_npwp: hasNpwp, realized_pnl: realizedPnl, dividends_received: dividendsReceived, final_tax_stock: finalTaxStock, final_tax_dividend: finalTaxDividend, net_income: realizedPnl + dividendsReceived - finalTaxStock - finalTaxDividend, trades: normalizedTrades, dividends: dividendDetails } });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
