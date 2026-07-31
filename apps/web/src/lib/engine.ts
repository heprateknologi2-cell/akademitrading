import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function fetchEngine(path: string, revalidate: number) {
  return fetch(`${API_BASE}${path}`, { next: { revalidate } });
}

export function engineResponse(res: Response) {
  return new NextResponse(res.body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
