"use client";

import Image from "next/image";

import type { Subsystem } from "@/content/types";

export function ScreensTab({ subsystem }: { subsystem: Subsystem }) {
  if (subsystem.screens.length === 0) {
    return (
      <div className="inset px-6 py-10 text-center">
        <p className="text-sm text-ink-soft">No captures added yet.</p>
        <p className="mx-auto mt-2 max-w-md text-xs text-ink-soft">
          Screenshots of the running application land here in plain hairline frames: files go
          in public/screens/{subsystem.slug}/ and are listed in the subsystem&apos;s screens
          array with real dimensions and captions.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {subsystem.screens.map((screen) => {
        // Portrait captures (a phone app) would otherwise stretch to the full
        // column and tower over the landscape ones, so they get their own cap.
        const portrait = screen.height > screen.width;
        return (
          <li key={screen.src}>
            <figure style={portrait ? { maxWidth: 300 } : undefined}>
              <div className="plate p-1.5">
                <Image
                  src={screen.src}
                  alt={screen.alt}
                  width={screen.width}
                  height={screen.height}
                  sizes={portrait ? "300px" : "(min-width: 768px) 45vw, 92vw"}
                  className="h-auto w-full"
                />
              </div>
              <figcaption className="mt-1.5 text-xs text-ink-soft">{screen.caption}</figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
