"use client";

import { useEffect, useRef } from "react";

import type { Subsystem } from "@/content/types";

const ROWS: Array<{ key: "decision" | "constraint" | "rejected" | "consequence"; label: string }> = [
  { key: "decision", label: "The decision" },
  { key: "constraint", label: "The constraint that forced it" },
  { key: "rejected", label: "Rejected" },
  { key: "consequence", label: "Consequence accepted" },
];

export function DecisionsTab({
  subsystem,
  highlightIndex,
}: {
  subsystem: Subsystem;
  highlightIndex: number | null;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightIndex === null) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `#dec-${subsystem.slug}-${highlightIndex}`,
    );
    if (el) {
      el.scrollIntoView({ block: "center" });
      el.focus();
    }
  }, [highlightIndex, subsystem.slug]);

  return (
    <div ref={listRef}>
      <ul className="space-y-3">
        {subsystem.decisions.map((d, i) => (
          <li
            key={d.title}
            id={`dec-${subsystem.slug}-${i}`}
            tabIndex={-1}
            className={`plate p-5 ${highlightIndex === i ? "outline outline-2 outline-offset-2 outline-channel-text" : ""}`}
          >
            <h3 className="text-md font-semibold">{d.title}</h3>
            <dl className="mt-3 grid gap-x-8 gap-y-3 md:grid-cols-2">
              {ROWS.map((r) => (
                <div key={r.key}>
                  <dt className="text-xs font-medium text-channel-text">{r.label}</dt>
                  <dd className="prose-reading mt-1 text-base">{d[r.key]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <section className="mt-8" aria-labelledby={`limits-${subsystem.slug}`}>
        <h3 id={`limits-${subsystem.slug}`} className="text-lg font-semibold">
          Known limitations
        </h3>
        <ul className="mt-3 space-y-3">
          {subsystem.limitations.map((l, i) => (
            <li key={i} className="prose-reading border-l-2 border-channel pl-4 text-base">
              {l}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
