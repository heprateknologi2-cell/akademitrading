import { NextResponse } from "next/server";
import { createHash } from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, transaction_status, gross_amount, signature_key } = body;

    const hash = createHash("sha512")
      .update(order_id + transaction_status + gross_amount + MIDTRANS_SERVER_KEY)
      .digest("hex");

    if (hash !== signature_key) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    if (["capture", "settlement"].includes(transaction_status)) {
      const [userEmail, plan] = (order_id as string).split("-").slice(1, 3);
      console.log(`[Midtrans] Payment success: ${order_id}, plan: ${plan}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
