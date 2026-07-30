import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stocks = await (await fetch(`${API_BASE}/api/stocks`)).json();
  const watchlist = ((session.user as any).watchlist || "BBCA,TLKM,ASII").split(",").map((code: string) => {
    const stock = (stocks.data || []).find((s: any) => s.code === code);
    return { code, name: stock?.name || code, price: null, alert_price: null };
  });

  return NextResponse.json({ data: watchlist });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, alert_price } = await req.json();
  if (!code) return NextResponse.json({ error: "Stock code required" }, { status: 400 });

  return NextResponse.json({ data: { code, alert_price, added: true } });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  return NextResponse.json({ data: { code, removed: true } });
}
