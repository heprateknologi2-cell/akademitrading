import { engineResponse, fetchEngine } from "@/lib/engine";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const res = await fetchEngine(`/api/stocks/${encodeURIComponent(code)}/rating`, 300);
  return engineResponse(res);
}
