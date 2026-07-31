import { auth } from "@/lib/auth";
import { db, ideaLikes, ideas } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id || session?.user?.email || "";
  const code = new URL(req.url).searchParams.get("code")?.toUpperCase();
  try {
    const rows = await db.select().from(ideas).where(code ? eq(ideas.code, code) : undefined).orderBy(desc(ideas.createdAt)).limit(100);
    const liked = userId ? await db.select({ ideaId: ideaLikes.ideaId }).from(ideaLikes).where(eq(ideaLikes.userId, userId)) : [];
    const likedIds = new Set(liked.map((item) => item.ideaId));
    return NextResponse.json({ data: rows.map((item) => ({ ...item, liked_by_user: likedIds.has(item.id) })) });
  } catch {
    return NextResponse.json({ data: [], error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.tier !== "pro") return NextResponse.json({ error: "Posting ide hanya untuk pengguna PRO" }, { status: 403 });
  const userId = session.user.id || session.user.email || "";
  const body = await req.json();
  const code = String(body.code || "").trim().toUpperCase();
  const title = String(body.title || "").trim();
  const content = String(body.body || "").trim();
  const direction = ["bullish", "bearish", "neutral"].includes(body.direction) ? body.direction : "neutral";
  if (!code || !title || !content) return NextResponse.json({ error: "Kode, judul, dan analisis wajib diisi" }, { status: 400 });
  if (title.length > 200 || content.length > 10000) return NextResponse.json({ error: "Konten terlalu panjang" }, { status: 400 });
  try {
    const [created] = await db.insert(ideas).values({ userId, code, title, body: content, direction, chartThumb: body.chart_thumb || null }).returning();
    return NextResponse.json({ data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
