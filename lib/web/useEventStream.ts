"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { safeParseJson } from "@/lib/safe-json";

type EventHandler = (event: { type?: string; [key: string]: unknown }) => void;

export function useEventStream(onEvent?: EventHandler, instanceId?: string | null) {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [lastEvent, setLastEvent] = useState<number>(0);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (evRef.current) {
      evRef.current.close();
      evRef.current = null;
    }
    setStatus("connecting");

    const url = instanceId
      ? `/api/opencode/event?instanceId=${encodeURIComponent(instanceId)}`
      : "/api/opencode/event";
    const ev = new EventSource(url, { withCredentials: true });
    evRef.current = ev;

    ev.onopen = () => setStatus("connected");
    ev.onerror = () => {
      setStatus("disconnected");
      ev.close();
      evRef.current = null;
      reconnectRef.current = setTimeout(() => connectRef.current(), 3000);
    };

    ev.onmessage = (e) => {
      setLastEvent(Date.now());
      const data = safeParseJson<Record<string, unknown>>(e.data ?? "", {});
      const payload = { ...data, type: (data.type as string) ?? (e.type !== "message" ? e.type : undefined) };
      onEventRef.current?.(payload as { type?: string; [key: string]: unknown });
    };
  }, []);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect, instanceId]);

  useEffect(() => {
    const id = setTimeout(() => connect(), 0);
    return () => {
      clearTimeout(id);
      if (evRef.current) {
        evRef.current.close();
        evRef.current = null;
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };
  }, [connect]);

  return { status, lastEvent };
}
