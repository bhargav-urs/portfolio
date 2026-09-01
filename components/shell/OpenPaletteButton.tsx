"use client";

import { useShellState } from "@/components/shell/ShellState";

export function OpenPaletteButton() {
  const { setPaletteOpen } = useShellState();
  return (
    <button
      type="button"
      onClick={() => setPaletteOpen(true)}
      className="plate mt-5 px-4 py-2 text-sm font-medium"
    >
      Open the palette
      <kbd className="ml-3 font-machine text-xs text-ink-soft">ctrl K</kbd>
    </button>
  );
}
