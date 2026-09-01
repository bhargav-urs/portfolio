"use client";

import type { Subsystem } from "@/content/types";

export function MetricsTab({ subsystem }: { subsystem: Subsystem }) {
  return (
    <div>
      <table className="w-full max-w-2xl border-collapse text-left">
        <caption className="sr-only-list">Measured facts about {subsystem.name}</caption>
        <tbody>
          {subsystem.metrics.map((metric, i) => (
            <tr key={metric.label} className={i % 2 === 1 ? "bg-recess" : ""}>
              <td className="tnum w-28 py-2 pl-3 pr-6 text-right text-md font-semibold">
                {metric.value}
              </td>
              <td className="py-2 pr-3 text-sm text-ink-soft">{metric.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="prose-reading mt-4 text-sm text-ink-soft">
        Every figure above is measured from the repository or the running system. If a number
        is not measured, it does not appear.
      </p>
    </div>
  );
}
