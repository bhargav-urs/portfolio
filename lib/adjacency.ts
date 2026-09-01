import type { SchematicNode, Subsystem } from "@/content/types";

export type Direction = "up" | "down" | "left" | "right";

const center = (n: SchematicNode) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });

/**
 * Arrow-key movement across the schematic. Edges come first: the focus
 * walks the wires. When no wired neighbour lies in the pressed direction,
 * the nearest node in that direction is used so no node is unreachable.
 */
export function nextNode(
  sub: Subsystem,
  currentId: string,
  dir: Direction,
): string | null {
  const current = sub.nodes.find((n) => n.id === currentId);
  if (!current) return null;

  const neighbours = new Set<string>();
  for (const e of sub.edges) {
    if (e.from === currentId) neighbours.add(e.to);
    if (e.to === currentId) neighbours.add(e.from);
  }

  const pick = (candidates: SchematicNode[]): string | null => {
    const c = center(current);
    let best: string | null = null;
    let bestScore = Infinity;
    for (const n of candidates) {
      const p = center(n);
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const forward =
        dir === "up" ? -dy : dir === "down" ? dy : dir === "left" ? -dx : dx;
      const sideways = dir === "up" || dir === "down" ? Math.abs(dx) : Math.abs(dy);
      if (forward <= 0) continue;
      const score = forward + sideways * 2;
      if (score < bestScore) {
        bestScore = score;
        best = n.id;
      }
    }
    return best;
  };

  const wired = pick(sub.nodes.filter((n) => neighbours.has(n.id)));
  if (wired) return wired;
  return pick(sub.nodes.filter((n) => n.id !== currentId));
}

export function connectionsOf(sub: Subsystem, nodeId: string): string[] {
  const out: string[] = [];
  for (const e of sub.edges) {
    if (e.from === nodeId) {
      const target = sub.nodes.find((n) => n.id === e.to);
      if (target) out.push(`to ${target.label}${e.label ? ` over ${e.label}` : ""}`);
    }
    if (e.to === nodeId) {
      const source = sub.nodes.find((n) => n.id === e.from);
      if (source) out.push(`from ${source.label}${e.label ? ` over ${e.label}` : ""}`);
    }
  }
  return out;
}
