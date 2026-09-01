"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { SchematicNode, Subsystem } from "@/content/types";
import { connectionsOf, nextNode, type Direction } from "@/lib/adjacency";
import { labelAnchor, lengthOf, pathFrom, routeEdge, wrapLabel } from "@/lib/geometry";

const KIND_WORD: Record<SchematicNode["kind"], string> = {
  client: "client",
  service: "service",
  datastore: "datastore",
  external: "external",
};

const ARROWS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Up: "up",
  Down: "down",
  Left: "left",
  Right: "right",
};

function alreadyBooted(): boolean {
  try {
    return sessionStorage.getItem("console-booted") === "1";
  } catch {
    return true;
  }
}

function markBooted(): void {
  try {
    sessionStorage.setItem("console-booted", "1");
  } catch {
    // A blocked storage just means the draw can run again next visit.
  }
}

type Props = {
  subsystem: Subsystem;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Node ids lit by the active technology filter; null when no filter. */
  litNodes: Set<string> | null;
};

export function Schematic({ subsystem, selectedId, onSelect, litNodes }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [boot, setBoot] = useState(false);
  const hitRefs = useRef(new Map<string, HTMLButtonElement>());
  const [focusId, setFocusId] = useState<string | null>(null);

  // The drawing is in the server HTML in its final state; the one boot
  // draw attaches here, on the first schematic of the session only.
  useEffect(() => {
    if (!alreadyBooted()) {
      setBoot(true);
      markBooted();
    }
  }, []);

  // External selection (palette, deep link): bring the node into view and focus it.
  useEffect(() => {
    if (!selectedId) return;
    const hit = hitRefs.current.get(selectedId);
    if (hit && document.activeElement !== hit) {
      hit.scrollIntoView({ block: "nearest", inline: "nearest" });
      hit.focus({ preventScroll: true });
    }
  }, [selectedId]);

  const routes = useMemo(
    () =>
      subsystem.edges.flatMap((edge, i) => {
        const from = subsystem.nodes.find((n) => n.id === edge.from);
        const to = subsystem.nodes.find((n) => n.id === edge.to);
        if (!from || !to) return [];
        const points = routeEdge(edge, from, to);
        return [{ edge, points, i, order: subsystem.nodes.findIndex((n) => n.id === edge.to) }];
      }),
    [subsystem],
  );

  const firstNode = subsystem.nodes[0];
  const tabTarget = focusId ?? selectedId ?? (firstNode ? firstNode.id : null);

  const handleKey = (e: React.KeyboardEvent, node: SchematicNode) => {
    const dir = ARROWS[e.key];
    if (dir) {
      e.preventDefault();
      const next = nextNode(subsystem, node.id, dir);
      if (next) {
        setFocusId(next);
        hitRefs.current.get(next)?.focus();
      }
      return;
    }
    if (e.key === "Escape" && selectedId) {
      e.preventDefault();
      onSelect(null);
    }
  };

  const pctX = (v: number) => `${(v / subsystem.canvas.w) * 100}%`;
  const pctY = (v: number) => `${(v / subsystem.canvas.h) * 100}%`;

  return (
    <div className="inset overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
      <div className="relative" style={{ minWidth: 700 }}>
        <svg
          viewBox={`0 0 ${subsystem.canvas.w} ${subsystem.canvas.h}`}
          aria-hidden="true"
          className={`block h-auto w-full ${boot ? "boot" : ""}`}
        >
          <defs>
            <pattern id={`grid-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="var(--hairline)" />
            </pattern>
            <marker
              id={`arrow-${uid}`}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0.5 L 8 4 L 0 7.5 z" style={{ fill: "var(--ch-text)" }} />
            </marker>
          </defs>

          <rect
            x="0"
            y="0"
            width={subsystem.canvas.w}
            height={subsystem.canvas.h}
            fill={`url(#grid-${uid})`}
          />

          {subsystem.boundaries.map((b) => (
            <g key={b.id}>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill="none"
                stroke="var(--hairline-strong)"
                strokeWidth={1}
                strokeDasharray="7 5"
              />
              <text
                x={b.x + 10}
                y={b.y - 8}
                fontSize={11.5}
                fontWeight={600}
                fill="var(--ink-soft-deep)"
                fontFamily="var(--font-archivo)"
              >
                {b.label}
              </text>
              {b.note ? (
                <text
                  x={b.x + b.w - 10}
                  y={b.y - 8}
                  fontSize={10.5}
                  textAnchor="end"
                  fill="var(--ch-text)"
                  fontFamily="var(--font-archivo)"
                >
                  {b.note}
                </text>
              ) : null}
            </g>
          ))}

          {routes.map(({ edge, points, i, order }) => {
            const length = lengthOf(points);
            const auto = labelAnchor(points);
            const at = edge.labelPos ?? auto.at;
            const vertical = edge.labelPos ? false : auto.vertical;
            const labelW = edge.label ? edge.label.length * 6.1 + 10 : 0;
            return (
              <g key={`${edge.from}-${edge.to}-${i}`}>
                <path
                  d={pathFrom(points)}
                  fill="none"
                  stroke="var(--ch-text)"
                  strokeWidth={1.5}
                  strokeDasharray={edge.dashed ? "5 4" : undefined}
                  markerEnd={`url(#arrow-${uid})`}
                  className={edge.dashed ? "schematic-edge-fade" : "schematic-edge"}
                  style={{ "--edge-length": length, "--boot-order": order } as React.CSSProperties}
                />
                {edge.label ? (
                  <g
                    className="schematic-edge-label"
                    style={{ "--boot-order": order } as React.CSSProperties}
                  >
                    <rect
                      x={vertical ? at.x + 6 : at.x - labelW / 2}
                      y={at.y - 8}
                      width={labelW}
                      height={16}
                      fill="var(--panel-recess)"
                    />
                    <text
                      x={vertical ? at.x + 6 + labelW / 2 : at.x}
                      y={at.y + 3.5}
                      fontSize={10.5}
                      textAnchor="middle"
                      fill="var(--ch-text)"
                      fontFamily="var(--font-archivo)"
                      fontWeight={500}
                    >
                      {edge.label}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}

          {subsystem.nodes.map((node, i) => {
            const lines = wrapLabel(node.label, node.w);
            const dimmed = litNodes !== null && !litNodes.has(node.id);
            const lit = litNodes !== null && litNodes.has(node.id);
            const selected = selectedId === node.id;
            const lineH = 15;
            const blockH = lines.length * lineH + (node.sub ? 14 : 0);
            const firstBaseline = node.y + node.h / 2 - blockH / 2 + 11;
            const stroke = selected || lit ? "var(--ch-text)" : "var(--ink)";
            return (
              <g
                key={node.id}
                className="schematic-node"
                opacity={dimmed ? 0.3 : 1}
                style={{ "--boot-order": i } as React.CSSProperties}
              >
                {node.kind === "datastore" ? (
                  <path
                    d={`M ${node.x} ${node.y} H ${node.x + node.w - 14} L ${node.x + node.w} ${node.y + 14} V ${node.y + node.h} H ${node.x} Z`}
                    fill="var(--panel-raised)"
                    stroke={stroke}
                    strokeWidth={selected || lit ? 2.25 : 1.25}
                  />
                ) : (
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={node.h}
                    fill={node.kind === "external" ? "var(--panel-recess)" : "var(--panel-raised)"}
                    stroke={stroke}
                    strokeWidth={
                      node.kind === "client"
                        ? selected || lit
                          ? 3
                          : 2.5
                        : selected || lit
                          ? 2.25
                          : 1.25
                    }
                    strokeDasharray={node.kind === "external" ? "5 3" : undefined}
                  />
                )}
                {node.kind === "service" ? (
                  <rect
                    x={node.x + 1}
                    y={node.y + 1}
                    width={node.w - 2}
                    height={node.h - 2}
                    fill="var(--ch)"
                    fillOpacity={0.12}
                  />
                ) : null}
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={node.x + node.w / 2}
                    y={firstBaseline + li * lineH}
                    textAnchor="middle"
                    fontSize={12.5}
                    fontWeight={500}
                    fill="var(--ink)"
                    fontFamily="var(--font-archivo)"
                  >
                    {line}
                  </text>
                ))}
                {node.sub ? (
                  <text
                    x={node.x + node.w / 2}
                    y={firstBaseline + lines.length * lineH}
                    textAnchor="middle"
                    fontSize={9.5}
                    fill="var(--ink-soft-deep)"
                    fontFamily="var(--font-plex)"
                  >
                    {node.sub}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {/*
          The interactive layer. The drawing above is decorative; these
          buttons are the nodes as far as the keyboard and screen readers
          are concerned, one per plate, sitting exactly over it.
        */}
        <div
          className="absolute inset-0"
          role="group"
          aria-label={`${subsystem.name} architecture schematic. Arrow keys move between connected nodes; Enter opens a node.`}
        >
          {subsystem.nodes.map((node) => {
            const selected = selectedId === node.id;
            return (
              <button
                key={node.id}
                ref={(el) => {
                  if (el) hitRefs.current.set(node.id, el);
                  else hitRefs.current.delete(node.id);
                }}
                id={`node-${subsystem.slug}-${node.id}`}
                type="button"
                className="schematic-hit"
                style={{
                  left: pctX(node.x),
                  top: pctY(node.y),
                  width: pctX(node.w),
                  height: pctY(node.h),
                }}
                aria-label={`${node.label}, ${KIND_WORD[node.kind]} node`}
                aria-expanded={selected}
                tabIndex={tabTarget === node.id ? 0 : -1}
                onClick={() => onSelect(selected ? null : node.id)}
                onFocus={() => setFocusId(node.id)}
                onKeyDown={(e) => handleKey(e, node)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * The same system, as structure: every node with its kind, its role
 * sentence, and its wiring. Screen readers get this list; the SVG above
 * is the drawn version of exactly this.
 */
export function SchematicOutline({ subsystem }: { subsystem: Subsystem }) {
  return (
    <section className="sr-only-list" aria-label={`${subsystem.name} components, as a list`}>
      <ul>
        {subsystem.nodes.map((node) => (
          <li key={node.id}>
            {node.label}
            {node.sub ? ` (${node.sub})` : ""}, {KIND_WORD[node.kind]}. {node.detail.role}{" "}
            {connectionsOf(subsystem, node.id)
              .map((c) => `Connected ${c}.`)
              .join(" ")}
          </li>
        ))}
        {subsystem.boundaries.map((b) => (
          <li key={b.id}>
            Boundary: {b.label}
            {b.note ? `, ${b.note}` : ""}.
          </li>
        ))}
      </ul>
    </section>
  );
}
