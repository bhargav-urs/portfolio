import type { Slug } from "./types";

/**
 * Recorded traces for subsystems that are not publicly deployed.
 * Every entry here must come from a real local run captured with
 * scripts/capture-trace.mjs. Nothing in this file may be invented;
 * an absent entry renders as an honest empty state in the UI.
 */

export type RecordedPhase = {
  name: string;
  ms: number;
};

export type RecordedTrace = {
  /** ISO date of the local run the numbers came from. */
  capturedOn: string;
  /** The request that was timed, e.g. "GET /api/documents". */
  request: string;
  phases: RecordedPhase[];
  totalMs: number;
  /** Raw response body lines from the run, truncated by the UI at 12. */
  responseLines: string[];
};

export const recordedTraces: Partial<Record<Slug, RecordedTrace>> = {
  // convergeai: paste the output of `node scripts/capture-trace.mjs <url>` here.
  // mappedin: same.
  // agripulse: same.
};
