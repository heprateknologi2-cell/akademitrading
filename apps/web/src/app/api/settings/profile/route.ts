import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json().catch(() => ({}));
  if (name && name.length > 100) {
    return NextResponse.json({ error: "Nama terlalu panjang" }, { status: 400 });
  }

  try {
    await db
      .update(users)
      .set({ name: name || null, updatedAt: new Date() })
      .where(eq(users.email, session.user.email));

    return NextResponse.json({ data: { updated: true } });
  } catch (error) {
    console.error("[Settings/Profile] Error:", error);
    return NextResponse.json({ error: "Update gagal" }, { status: 500 });
  }
}
