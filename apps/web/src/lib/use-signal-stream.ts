"use client";

import { useEffect, useState } from "react";
import type { SignalItem } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useSignalStream() {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let attempts = 0;

    const connect = () => {
      const wsUrl = API_BASE.replace(/^http/, "ws") + "/ws/signals";
      socket = new WebSocket(wsUrl);
      socket.onopen = () => { attempts = 0; setConnected(true); };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type?: string; data?: SignalItem[] | SignalItem };
          const incoming = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
          if (incoming.length) setSignals((current) => [...incoming, ...current].slice(0, 100));
        } catch {}
      };
      socket.onclose = () => {
        setConnected(false);
        if (!stopped) {
          attempts += 1;
          timer = setTimeout(connect, Math.min(1000 * 2 ** attempts, 30000));
        }
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      socket?.close();
    };
  }, []);

  return { signals, connected };
}
