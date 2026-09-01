import type { LampState } from "@/lib/status";
import { LAMP_WORD } from "@/lib/status";

const FILL: Record<LampState, string> = {
  live: "var(--live)",
  waking: "var(--waking)",
  offline: "var(--offline)",
  unknown: "var(--unknown)",
};

/**
 * A signal lamp. State is always paired with a visible text label; the
 * colour is reinforcement, never the sole carrier.
 */
export function Lamp({
  state,
  word,
  settling = false,
}: {
  state: LampState;
  /** Visible label; defaults to the state word. */
  word?: string;
  settling?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={settling ? "lamp-settling" : undefined}
        style={{
          width: 9,
          height: 9,
          borderRadius: "var(--radius-lamp)",
          background: FILL[state],
          boxShadow: "inset 0 0 0 1px var(--hairline-strong)",
          flexShrink: 0,
        }}
      />
      <span className="text-xs text-ink-soft">{word ?? LAMP_WORD[state]}</span>
    </span>
  );
}
