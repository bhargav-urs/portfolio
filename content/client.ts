/**
 * Client-side content barrel. Ships the raw typed modules without the
 * zod layer; validation runs once on the server through content/index.ts,
 * so the browser never pays for the schema code.
 */

import { agripulse } from "./subsystems/agripulse";
import { chainvote } from "./subsystems/chainvote";
import { convergeai } from "./subsystems/convergeai";
import { findspace } from "./subsystems/findspace";
import { mappedin } from "./subsystems/mappedin";
import { profile } from "./profile";
import { education, roles } from "./experience";
import type { Slug, Subsystem } from "./types";

export const allSubsystems: Subsystem[] = [findspace, convergeai, mappedin, chainvote, agripulse];

export const bySlug: Record<Slug, Subsystem> = Object.fromEntries(
  allSubsystems.map((s) => [s.slug, s]),
) as Record<Slug, Subsystem>;

export type RailItem = {
  slug: Slug;
  name: string;
  statusMode: Subsystem["statusMode"];
  staticNote: string | undefined;
  techs: ReadonlySet<string>;
};

export const railItems: RailItem[] = allSubsystems.map((s) => ({
  slug: s.slug,
  name: s.name,
  statusMode: s.statusMode,
  staticNote: s.staticStatusNote,
  techs: new Set(s.stack.map((t) => t.tech)),
}));

/** Canonical technology registry for the filter and the palette. */
export type TechEntry = {
  tech: string;
  label: string;
  uses: Array<{ slug: Slug; subsystemName: string; nodes: string[] }>;
};

const techMap = new Map<string, TechEntry>();
for (const s of allSubsystems) {
  for (const entry of s.stack) {
    const existing = techMap.get(entry.tech);
    const use = { slug: s.slug, subsystemName: s.name, nodes: entry.nodes };
    if (existing) {
      existing.uses.push(use);
    } else {
      techMap.set(entry.tech, { tech: entry.tech, label: entry.label, uses: [use] });
    }
  }
}
export const techRegistry: ReadonlyMap<string, TechEntry> = techMap;

export function litNodesFor(slug: Slug, tech: string | null): Set<string> | null {
  if (!tech) return null;
  const entry = techMap.get(tech);
  if (!entry) return null;
  const use = entry.uses.find((u) => u.slug === slug);
  return new Set(use?.nodes ?? []);
}

export { profile, roles, education };
