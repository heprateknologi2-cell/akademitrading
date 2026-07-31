import { engineResponse, fetchEngine } from "@/lib/engine";

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const query = new URL(req.url).search;
  const res = await fetchEngine(`/api/stocks/${encodeURIComponent(code)}/history${query}`, 300);
  return engineResponse(res);
}
