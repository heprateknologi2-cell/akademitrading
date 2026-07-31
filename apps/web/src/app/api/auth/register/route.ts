import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const limited = rateLimit(`register:${ip}`, 5);
  if (limited) return limited;

  const { email, password, name } = await req.json().catch(() => ({}));

  if (!email || !validateEmail(email)) {
    return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  try {
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing[0]) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const [created] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        name: (name || email.split("@")[0]).slice(0, 100),
        password,
        tier: "free",
      })
      .returning();

    return NextResponse.json({ data: { id: created.id, email: created.email, name: created.name } });
  } catch (error) {
    console.error("[Register] Error:", error);
    return NextResponse.json({ error: "Pendaftaran gagal, coba lagi" }, { status: 500 });
  }
}
