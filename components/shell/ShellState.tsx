"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ShellState = {
  tech: string | null;
  setTech: (tech: string | null) => void;
  readerActive: boolean;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
};

const ShellContext = createContext<ShellState>({
  tech: null,
  setTech: () => undefined,
  readerActive: false,
  paletteOpen: false,
  setPaletteOpen: () => undefined,
});

export function useShellState(): ShellState {
  return useContext(ShellContext);
}

export function ShellStateProvider({ children }: { children: ReactNode }) {
  const [tech, setTechState] = useState<string | null>(null);
  const [readerActive, setReaderActive] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const setTech = useCallback(
    (next: string | null) => {
      // The URL mirrors the filter so the state is shareable and
      // survives reload; window.location is current here because this
      // only runs from user events.
      const params = new URLSearchParams(window.location.search);
      const current = params.get("tech");
      const value = current === next ? null : next;
      setTechState(value);
      if (value) params.set("tech", value);
      else params.delete("tech");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  return (
    <ShellContext.Provider
      value={{ tech, setTech, readerActive, paletteOpen, setPaletteOpen }}
    >
      <UrlBridgeMount setTechState={setTechState} setReaderActive={setReaderActive} />
      {children}
    </ShellContext.Provider>
  );
}

function UrlBridgeMount(props: {
  setTechState: (t: string | null) => void;
  setReaderActive: (r: boolean) => void;
}) {
  return (
    <Suspense fallback={null}>
      <UrlBridge {...props} />
    </Suspense>
  );
}

/**
 * The one component allowed to read useSearchParams. Everything above it
 * stays out of the Suspense boundary so the static shell keeps its content.
 */
function UrlBridge({
  setTechState,
  setReaderActive,
}: {
  setTechState: (t: string | null) => void;
  setReaderActive: (r: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const tech = searchParams.get("tech");
  const view = searchParams.get("view");
  const readerHere = pathname === "/" && view === "reader";

  useEffect(() => {
    setTechState(tech);
  }, [tech, setTechState]);

  useEffect(() => {
    setReaderActive(readerHere);
    if (readerHere) {
      document.documentElement.setAttribute("data-reader", "1");
    } else {
      document.documentElement.removeAttribute("data-reader");
    }
    if (pathname === "/" && view !== null) {
      try {
        localStorage.setItem("preferred-view", view === "reader" ? "reader" : "console");
      } catch {
        // Preference just will not persist.
      }
    }
  }, [readerHere, pathname, view, setReaderActive]);

  // A recruiter who chose Reader once gets Reader back on return visits.
  useEffect(() => {
    if (pathname !== "/" || view !== null) return;
    try {
      if (localStorage.getItem("preferred-view") === "reader") {
        router.replace("/?view=reader");
      }
    } catch {
      // Fall through to the console.
    }
  }, [pathname, view, router]);

  return null;
}
