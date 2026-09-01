"use client";

import dynamic from "next/dynamic";
import { LazyMotion, domAnimation } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { StatusProvider } from "@/components/StatusProvider";
import { Rail } from "@/components/shell/Rail";
import { ShellStateProvider, useShellState } from "@/components/shell/ShellState";

const CommandPalette = dynamic(
  () => import("@/components/palette/CommandPalette").then((mod) => mod.CommandPalette),
  { ssr: false },
);

const ReaderView = dynamic(
  () => import("@/components/reader/ReaderView").then((mod) => mod.ReaderView),
  { ssr: false },
);

function ShellInner({ children }: { children: ReactNode }) {
  const { tech, readerActive, paletteOpen, setPaletteOpen } = useShellState();
  const [paletteMounted, setPaletteMounted] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paletteOpen) setPaletteMounted(true);
  }, [paletteOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  return (
    <>
      <div
        ref={consoleRef}
        className="console-root min-h-dvh rail:flex"
        inert={readerActive ? true : undefined}
      >
        <Rail tech={tech} onOpenPalette={() => setPaletteOpen(true)} />
        <main id="plate" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
      {readerActive ? (
        <div className="reader-root fixed inset-0 z-30 overflow-y-auto bg-panel">
          <ReaderView />
        </div>
      ) : null}
      {paletteMounted ? (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      ) : null}
    </>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <StatusProvider>
      <ShellStateProvider>
        <LazyMotion features={domAnimation} strict>
          <ShellInner>{children}</ShellInner>
        </LazyMotion>
      </ShellStateProvider>
    </StatusProvider>
  );
}
