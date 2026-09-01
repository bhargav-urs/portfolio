"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { Slug } from "@/content/types";
import type { ServiceStatus, StatusPayload } from "@/lib/status";

type StatusContextValue = {
  /** null while the check is still in flight. */
  payload: StatusPayload | null;
  serviceFor: (slug: Slug) => ServiceStatus;
};

const FALLBACK: ServiceStatus = { state: "unknown", detail: "check not run" };

const StatusContext = createContext<StatusContextValue>({
  payload: null,
  serviceFor: () => FALLBACK,
});

export function StatusProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<StatusPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: StatusPayload | null) => {
        if (!cancelled && data) setPayload(data);
      })
      .catch(() => {
        // Lamps stay at unknown; a failed check never fabricates a state.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const serviceFor = (slug: Slug): ServiceStatus => payload?.services[slug] ?? FALLBACK;

  return (
    <StatusContext.Provider value={{ payload, serviceFor }}>{children}</StatusContext.Provider>
  );
}

export function useStatus(): StatusContextValue {
  return useContext(StatusContext);
}
