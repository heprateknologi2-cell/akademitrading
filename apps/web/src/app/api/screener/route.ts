import { engineResponse, fetchEngine } from "@/lib/engine";

export async function GET(req: Request) {
  const query = new URL(req.url).search;
  const res = await fetchEngine(`/api/screener${query}`, 30);
  return engineResponse(res);
}
