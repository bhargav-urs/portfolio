"use client";

import type { StackEntry, Subsystem } from "@/content/types";

const GROUP_LABELS: Record<StackEntry["group"], string> = {
  frontend: "Frontend",
  backend: "Backend",
  data: "Data",
  contracts: "Contracts",
  device: "Device",
  infra: "Infrastructure",
  testing: "Testing",
  standards: "Standards",
};

const GROUP_ORDER: StackEntry["group"][] = [
  "frontend",
  "backend",
  "contracts",
  "device",
  "data",
  "testing",
  "infra",
  "standards",
];

export function StackTab({
  subsystem,
  tech,
  setTech,
}: {
  subsystem: Subsystem;
  tech: string | null;
  setTech: (t: string | null) => void;
}) {
  const groups = GROUP_ORDER.map((g) => ({
    group: g,
    entries: subsystem.stack.filter((s) => s.group === g),
  })).filter((g) => g.entries.length > 0);

  return (
    <div>
      <p className="prose-reading text-sm text-ink-soft">
        Every chip resolves to the schematic nodes where the technology actually runs.
        Activating one lights those nodes here and dims the rail subsystems that never use it.
      </p>
      {groups.map(({ group, entries }) => (
        <section key={group} className="mt-5">
          <h3 className="text-xs font-medium text-ink-soft">{GROUP_LABELS[group]}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {entries.map((entry) => {
              const active = tech === entry.tech;
              return (
                <li key={entry.tech}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTech(entry.tech)}
                    className={`px-3 py-1.5 text-sm ${
                      active
                        ? "font-medium text-channel-text"
                        : "plate hover:text-channel-text"
                    }`}
                    style={
                      active
                        ? {
                            background: "color-mix(in srgb, var(--ch) 12%, var(--panel-raised))",
                            boxShadow: "inset 0 0 0 1.5px var(--ch-text)",
                            borderRadius: "var(--radius-plate)",
                          }
                        : undefined
                    }
                  >
                    {entry.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {tech !== null ? (
        <button
          type="button"
          onClick={() => setTech(null)}
          className="mt-5 text-sm text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          Clear the filter
        </button>
      ) : null}
    </div>
  );
}
