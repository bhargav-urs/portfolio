import type { Slug } from "@/content/types";

export type LampState = "live" | "waking" | "offline" | "unknown";

export type ServiceStatus = {
  state: LampState;
  detail: string;
  ms?: number;
};

export type StatusPayload = {
  checkedAt: string;
  services: Record<Slug, ServiceStatus>;
};

export const LAMP_WORD: Record<LampState, string> = {
  live: "live",
  waking: "waking",
  offline: "offline",
  unknown: "unknown",
};
