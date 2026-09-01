import type { Slug } from "@/content/types";

export const NODE_EVENT = "console-focus-node";
export const DECISION_EVENT = "console-focus-decision";

export type NodeFocusDetail = { slug: Slug; nodeId: string };
export type DecisionFocusDetail = { slug: Slug; index: number };

export function emitNodeFocus(detail: NodeFocusDetail): void {
  window.dispatchEvent(new CustomEvent(NODE_EVENT, { detail }));
}

export function emitDecisionFocus(detail: DecisionFocusDetail): void {
  window.dispatchEvent(new CustomEvent(DECISION_EVENT, { detail }));
}
