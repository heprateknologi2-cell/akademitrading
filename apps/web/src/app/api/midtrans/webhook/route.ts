import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db, users, subscriptions } from "@/lib/db";
import { eq, and } from "drizzle-orm";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, transaction_status, gross_amount, signature_key, fraud_status } = body;

    if (!order_id || !transaction_status || !gross_amount || !signature_key) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const hash = createHash("sha512")
      .update(order_id + transaction_status + gross_amount + MIDTRANS_SERVER_KEY)
      .digest("hex");

    if (hash !== signature_key) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const successStatuses = ["capture", "settlement"];
    const isCapture = transaction_status === "capture";
    if (isCapture && fraud_status && fraud_status !== "accept") {
      return NextResponse.json({ status: "fraud_rejected" });
    }

    const subs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.midtransId, order_id))
      .limit(1);

    const sub = subs[0];
    if (!sub) {
      console.warn(`[Midtrans] No pending subscription for order_id: ${order_id}`);
      return NextResponse.json({ status: "no_subscription" });
    }

    const userRows = await db.select().from(users).where(eq(users.id, sub.userId)).limit(1);
    const user = userRows[0];
    if (!user) {
      return NextResponse.json({ status: "no_user" });
    }

    if (successStatuses.includes(transaction_status)) {
      await db
        .update(subscriptions)
        .set({ status: "active" })
        .where(eq(subscriptions.id, sub.id))
        .execute();

      await db
        .update(users)
        .set({ tier: sub.tier, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .execute();

      console.log(`[Midtrans] Payment success: ${order_id}, user ${user.email} -> tier ${sub.tier}`);
      return NextResponse.json({ status: "ok", tier: sub.tier });
    }

    if (["deny", "cancel", "expire", "failure"].includes(transaction_status)) {
      await db
        .update(subscriptions)
        .set({ status: "expired" })
        .where(and(eq(subscriptions.id, sub.id), eq(subscriptions.status, "pending")))
        .execute();
      return NextResponse.json({ status: "failed" });
    }

    return NextResponse.json({ status: "ignored", transaction_status });
  } catch (error) {
    console.error("[Midtrans webhook] Error:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
