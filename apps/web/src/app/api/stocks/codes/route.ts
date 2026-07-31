import { engineResponse, fetchEngine } from "@/lib/engine";

export async function GET() {
  const res = await fetchEngine("/api/stocks/codes", 86400);
  return engineResponse(res);
}
