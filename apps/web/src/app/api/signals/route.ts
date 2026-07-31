import { engineResponse, fetchEngine } from "@/lib/engine";

export async function GET() {
  const res = await fetchEngine("/api/signals/today", 60);
  return engineResponse(res);
}
