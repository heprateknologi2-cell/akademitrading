import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db, positions } from "@/lib/db";
import { and, eq } from "drizzle-orm";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id || session.user.email || "";
  const { id } = await params;

  const body = await req.json();
  try {
    const [existing] = await db.select().from(positions).where(and(eq(positions.id, Number(id)), eq(positions.userId, userId)));
    if (!existing) return NextResponse.json({ error: "Position not found" }, { status: 404 });
    if (existing.status !== "open") return NextResponse.json({ error: "Position already closed" }, { status: 400 });

    if (body.exit_price !== undefined) {
      const entry = num(existing.entryPrice);
      const qty = num(existing.quantity);
      const exit = Number(body.exit_price);
      const isLong = existing.side !== "short";
      const pnl = (isLong ? exit - entry : entry - exit) * qty;
      const pnlPercent = entry > 0 ? (pnl / (entry * qty)) * 100 : 0;
      const [updated] = await db
        .update(positions)
        .set({
          status: "closed",
          exitPrice: String(exit),
          pnl: String(pnl),
          pnlPercent: String(pnlPercent.toFixed(2)),
          closedAt: new Date(),
        })
        .where(eq(positions.id, Number(id)))
        .returning();
      return NextResponse.json({ data: updated });
    }

    const update: Record<string, string> = {};
    if (body.stop_loss !== undefined) update.stopLoss = body.stop_loss ? String(body.stop_loss) : null as unknown as string;
    if (body.take_profit !== undefined) update.takeProfit = body.take_profit ? String(body.take_profit) : null as unknown as string;
    const [updated] = await db.update(positions).set(update).where(eq(positions.id, Number(id))).returning();
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id || session.user.email || "";
  const { id } = await params;

  try {
    await db.delete(positions).where(and(eq(positions.id, Number(id)), eq(positions.userId, userId)));
    return NextResponse.json({ data: { id, deleted: true } });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}
