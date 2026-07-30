import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_BASE_URL = process.env.MIDTRANS_BASE_URL || "https://app.sandbox.midtrans.com";

const PLANS: Record<string, { amount: number; name: string; durationDays: number }> = {
  pro_monthly: { amount: 75000, name: "Akademitrading PRO (Bulanan)", durationDays: 30 },
  pro_yearly: { amount: 750000, name: "Akademitrading PRO (Tahunan)", durationDays: 365 },
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();
  const selectedPlan = PLANS[plan];
  if (!selectedPlan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const orderId = `AK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const res = await fetch(`${MIDTRANS_BASE_URL}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: selectedPlan.amount,
        },
        item_details: [{
          id: plan,
          price: selectedPlan.amount,
          quantity: 1,
          name: selectedPlan.name,
        }],
        customer_details: {
          email: session.user.email,
          first_name: session.user.name || session.user.email,
        },
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/subscription/success`,
        },
      }),
    });

    const data = await res.json();
    return NextResponse.json({ token: data.token, redirect_url: data.redirect_url, order_id: orderId });
  } catch (error) {
    return NextResponse.json({ error: "Payment initiation failed" }, { status: 500 });
  }
}
