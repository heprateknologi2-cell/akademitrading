import { engineResponse, fetchEngine } from "@/lib/engine";

export async function GET(req: Request) {
  const query = new URL(req.url).search;
  const res = await fetchEngine(`/api/dividends${query}`, 86400);
  return engineResponse(res);
}
