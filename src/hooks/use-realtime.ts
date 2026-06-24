"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const RECONNECT_DELAY_MS = 3_000;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Subscribes to the project's SSE stream and invalidates the project query
 * whenever a DONATION or MILESTONE event arrives. Reconnects automatically
 * after transient failures with exponential back-off up to MAX_RECONNECT_ATTEMPTS.
 */
export function useRealtimeProject(projectSlug: string) {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const attemptsRef = useRef(0);
  const mountedRef = useRef(true);
  // Store connect in a ref so the onerror handler always calls the latest version
  const connectRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    if (!mountedRef.current || !projectSlug) return;
    if (typeof window === "undefined") return;

    const url = `/api/projects/${projectSlug}/stream`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      attemptsRef.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as { type: string };
        if (data.type === "DONATION" || data.type === "MILESTONE" || data.type === "ESCROW") {
          void queryClient.invalidateQueries({ queryKey: ["project", projectSlug] });
        }
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      if (!mountedRef.current) return;

      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return;

      const delay = RECONNECT_DELAY_MS * Math.pow(2, attemptsRef.current - 1);
      // Use the ref so we always call the latest connect function
      setTimeout(() => connectRef.current?.(), delay);
    };
  }, [projectSlug, queryClient]);

  useEffect(() => {
    // Keep the ref in sync with the latest connect function
    connectRef.current = connect;
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);
}

/** Legacy alias — use useRealtimeProject for new code. */
export function useRealtimeDonations(projectSlug: string) {
  return useRealtimeProject(projectSlug);
}

/** Default refetch interval for SSE-fallback polling. */
export function useProjectData(_slug: string) {
  return { refetchInterval: 30_000 };
}
