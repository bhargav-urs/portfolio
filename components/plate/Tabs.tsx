"use client";

import { useRef } from "react";

export type TabId = "decisions" | "stack" | "metrics" | "screens";

export const TAB_LABELS: Record<TabId, string> = {
  decisions: "Decisions",
  stack: "Stack",
  metrics: "Metrics",
  screens: "Screens",
};

const ORDER: TabId[] = ["decisions", "stack", "metrics", "screens"];

export function Tabs({
  value,
  onChange,
  idBase,
}: {
  value: TabId;
  onChange: (t: TabId) => void;
  idBase: string;
}) {
  const refs = useRef(new Map<TabId, HTMLButtonElement>());

  const move = (delta: number) => {
    const i = ORDER.indexOf(value);
    const next = ORDER[(i + delta + ORDER.length) % ORDER.length];
    if (next) {
      onChange(next);
      refs.current.get(next)?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Subsystem detail"
      className="inset flex w-full gap-0 p-1 sm:w-auto"
    >
      {ORDER.map((t) => (
        <button
          key={t}
          ref={(el) => {
            if (el) refs.current.set(t, el);
            else refs.current.delete(t);
          }}
          role="tab"
          id={`${idBase}-tab-${t}`}
          aria-selected={value === t}
          aria-controls={`${idBase}-panel-${t}`}
          tabIndex={value === t ? 0 : -1}
          onClick={() => onChange(t)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              move(1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              move(-1);
            } else if (e.key === "Home") {
              e.preventDefault();
              onChange("decisions");
              refs.current.get("decisions")?.focus();
            } else if (e.key === "End") {
              e.preventDefault();
              onChange("screens");
              refs.current.get("screens")?.focus();
            }
          }}
          className={`flex-1 whitespace-nowrap px-4 py-1.5 text-sm sm:flex-initial ${
            value === t
              ? "plate font-medium"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {TAB_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
