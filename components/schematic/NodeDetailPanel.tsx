"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef } from "react";

import type { SchematicNode } from "@/content/types";

const FIELDS: Array<{ key: keyof SchematicNode["detail"]; label: string }> = [
  { key: "role", label: "Role" },
  { key: "why", label: "Why this, here" },
  { key: "rejected", label: "Rejected" },
  { key: "breaks", label: "What breaks first" },
];

export function NodeDetailPanel({
  node,
  onClose,
}: {
  node: SchematicNode | null;
  onClose: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (node) headingRef.current?.focus();
  }, [node]);

  return (
    <AnimatePresence initial={false}>
      {node ? (
        <m.div
          key={node.id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 480, damping: 44 }}
          style={{ overflow: "hidden" }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onClose();
            }
          }}
        >
          <div className="plate mt-3 p-5" role="region" aria-label={`${node.label} detail`}>
            <div className="hairline-b flex items-baseline justify-between gap-4 pb-3">
              <h3
                ref={headingRef}
                tabIndex={-1}
                className="text-md font-semibold"
              >
                {node.label}
                <span className="ml-3 text-xs font-normal text-channel-text">
                  {node.kind} node
                </span>
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
              >
                Close
              </button>
            </div>
            <dl className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <dt className="text-xs font-medium text-channel-text">{f.label}</dt>
                  <dd className="prose-reading mt-1 text-base">{node.detail[f.key]}</dd>
                </div>
              ))}
            </dl>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
