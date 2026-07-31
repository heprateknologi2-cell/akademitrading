import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db, users, subscriptions } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRows = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    const user = userRows[0];
    if (!user) {
      return NextResponse.json({ data: { tier: "free", subscriptions: [] } });
    }

    const subs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.createdAt));

    const now = new Date();
    const activeSub = subs.find((s) => s.status === "active" && s.endDate && new Date(s.endDate) > now);

    return NextResponse.json({
      data: {
        user: { id: user.id, name: user.name, email: user.email, tier: user.tier },
        activeSubscription: activeSub
          ? {
              tier: activeSub.tier,
              startDate: activeSub.startDate,
              endDate: activeSub.endDate,
              status: activeSub.status,
              midtransId: activeSub.midtransId,
            }
          : null,
        subscriptions: subs.map((s) => ({
          tier: s.tier,
          startDate: s.startDate,
          endDate: s.endDate,
          status: s.status,
          midtransId: s.midtransId,
        })),
      },
    });
  } catch (error) {
    console.error("[Settings/Subscription] Error:", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }
}
