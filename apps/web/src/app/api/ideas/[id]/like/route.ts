import { auth } from "@/lib/auth";
import { db, ideaLikes, ideas } from "@/lib/db";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id || session.user.email || "";
  const { id } = await ctx.params;
  const ideaId = Number(id);
  if (!Number.isInteger(ideaId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  try {
    return await db.transaction(async (tx) => {
      const existing = await tx.select({ id: ideaLikes.id }).from(ideaLikes).where(and(eq(ideaLikes.ideaId, ideaId), eq(ideaLikes.userId, userId))).limit(1);
      if (existing[0]) {
        await tx.delete(ideaLikes).where(eq(ideaLikes.id, existing[0].id));
        const [idea] = await tx.update(ideas).set({ likes: sql`greatest(coalesce(${ideas.likes}, 0) - 1, 0)` }).where(eq(ideas.id, ideaId)).returning({ likes: ideas.likes });
        return NextResponse.json({ data: { liked: false, likes: idea?.likes || 0 } });
      }
      await tx.insert(ideaLikes).values({ ideaId, userId });
      const [idea] = await tx.update(ideas).set({ likes: sql`coalesce(${ideas.likes}, 0) + 1` }).where(eq(ideas.id, ideaId)).returning({ likes: ideas.likes });
      return NextResponse.json({ data: { liked: true, likes: idea?.likes || 0 } });
    });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
