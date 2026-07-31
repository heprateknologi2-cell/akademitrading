import { engineResponse, fetchEngine } from "@/lib/engine";

export async function GET() {
  const res = await fetchEngine("/api/market/overview", 30);
  return engineResponse(res);
}
