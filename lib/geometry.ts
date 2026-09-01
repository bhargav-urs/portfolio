import type { SchematicEdge, SchematicNode, Side } from "@/content/types";

export type Pt = { x: number; y: number };

const horizontal = (s: Side): boolean => s === "left" || s === "right";

export function port(n: SchematicNode, side: Side, at = 0.5): Pt {
  switch (side) {
    case "top":
      return { x: n.x + n.w * at, y: n.y };
    case "bottom":
      return { x: n.x + n.w * at, y: n.y + n.h };
    case "left":
      return { x: n.x, y: n.y + n.h * at };
    case "right":
      return { x: n.x + n.w, y: n.y + n.h * at };
  }
}

/**
 * Orthogonal routing: every edge is a run of horizontal and vertical
 * segments, the way a silkscreened schematic is drawn. `bend` pins the
 * middle segment when the midpoint default would cross something.
 */
export function routeEdge(edge: SchematicEdge, from: SchematicNode, to: SchematicNode): Pt[] {
  const a = port(from, edge.fromSide, edge.fromAt ?? 0.5);
  const b = port(to, edge.toSide, edge.toAt ?? 0.5);
  const fs = edge.fromSide;
  const ts = edge.toSide;

  if (horizontal(fs) && horizontal(ts)) {
    if (fs === ts) {
      const x =
        edge.bend ?? (fs === "left" ? Math.min(a.x, b.x) - 24 : Math.max(a.x, b.x) + 24);
      return [a, { x, y: a.y }, { x, y: b.y }, b];
    }
    if (a.y === b.y) return [a, b];
    const x = edge.bend ?? (a.x + b.x) / 2;
    return [a, { x, y: a.y }, { x, y: b.y }, b];
  }

  if (!horizontal(fs) && !horizontal(ts)) {
    if (fs === ts) {
      const y =
        edge.bend ?? (fs === "top" ? Math.min(a.y, b.y) - 24 : Math.max(a.y, b.y) + 24);
      return [a, { x: a.x, y }, { x: b.x, y }, b];
    }
    if (a.x === b.x) return [a, b];
    const y = edge.bend ?? (a.y + b.y) / 2;
    return [a, { x: a.x, y }, { x: b.x, y }, b];
  }

  if (horizontal(fs)) {
    return [a, { x: b.x, y: a.y }, b];
  }
  return [a, { x: a.x, y: b.y }, b];
}

export function pathFrom(points: Pt[]): string {
  const first = points[0];
  if (!first) return "";
  return points
    .slice(1)
    .reduce((d, p) => `${d} L ${p.x} ${p.y}`, `M ${first.x} ${first.y}`);
}

export function lengthOf(points: Pt[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const q = points[i - 1];
    if (p && q) total += Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
  }
  return total;
}

/** Anchor for the label plate: midpoint of the longest segment. */
export function labelAnchor(points: Pt[]): { at: Pt; vertical: boolean } {
  let best = 0;
  let bestLen = -1;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const q = points[i - 1];
    if (!p || !q) continue;
    const len = Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
    if (len > bestLen) {
      bestLen = len;
      best = i;
    }
  }
  const p = points[best];
  const q = points[best - 1];
  if (!p || !q) return { at: { x: 0, y: 0 }, vertical: false };
  return {
    at: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 },
    vertical: p.x === q.x,
  };
}

/** Two-line wrap for node labels; hand-positioned nodes keep labels short. */
export function wrapLabel(label: string, width: number, charPx = 7.2): string[] {
  const max = Math.max(4, Math.floor((width - 16) / charPx));
  if (label.length <= max) return [label];
  const words = label.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const joined = cur === "" ? w : `${cur} ${w}`;
    if (joined.length > max && cur !== "") {
      lines.push(cur);
      cur = w;
    } else {
      cur = joined;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines.slice(0, 3);
}
