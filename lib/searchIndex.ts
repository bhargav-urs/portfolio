import MiniSearch from "minisearch";

import { allSubsystems, profile, roles, techRegistry } from "@/content/client";
import type { Slug } from "@/content/types";

export type SearchDoc = {
  id: string;
  kind: "subsystem" | "node" | "decision" | "tech" | "experience" | "action";
  title: string;
  subtitle: string;
  text: string;
  slug?: Slug;
  nodeId?: string;
  decisionIndex?: number;
  tech?: string;
  action?: "resume" | "email" | "github" | "linkedin" | "theme" | "reader";
};

const docs: SearchDoc[] = [];

for (const s of allSubsystems) {
  docs.push({
    id: `sub-${s.slug}`,
    kind: "subsystem",
    title: s.name,
    subtitle: "subsystem",
    text: `${s.oneLine} ${s.readerSummary}`,
    slug: s.slug,
  });
  s.nodes.forEach((n) => {
    docs.push({
      id: `node-${s.slug}-${n.id}`,
      kind: "node",
      title: n.label,
      subtitle: `${s.name} schematic`,
      text: `${n.sub ?? ""} ${n.detail.role} ${n.detail.why}`,
      slug: s.slug,
      nodeId: n.id,
    });
  });
  s.decisions.forEach((d, i) => {
    docs.push({
      id: `dec-${s.slug}-${i}`,
      kind: "decision",
      title: d.title,
      subtitle: `${s.name} decision`,
      text: `${d.decision} ${d.constraint} ${d.rejected}`,
      slug: s.slug,
      decisionIndex: i,
    });
  });
}

for (const entry of techRegistry.values()) {
  docs.push({
    id: `tech-${entry.tech}`,
    kind: "tech",
    title: entry.label,
    subtitle: `stack, used in ${entry.uses.map((u) => u.subsystemName).join(", ")}`,
    text: entry.uses.map((u) => u.subsystemName).join(" "),
    tech: entry.tech,
  });
}

roles.forEach((r, i) => {
  docs.push({
    id: `exp-${i}`,
    kind: "experience",
    title: `${r.title}, ${r.org}`,
    subtitle: `${r.start} to ${r.end}`,
    text: r.impact,
  });
});

const actions: Array<[SearchDoc["action"], string, string]> = [
  ["resume", "Resume", `download the PDF`],
  ["email", "Email", profile.email],
  ["github", "GitHub", profile.github.host],
  ["linkedin", "LinkedIn", profile.linkedin.host],
  ["theme", "Switch finish", "light or dark panel"],
  ["reader", "Reader view", "the whole site as one fast page"],
];
for (const [action, title, subtitle] of actions) {
  if (!action) continue;
  docs.push({
    id: `act-${action}`,
    kind: "action",
    title,
    subtitle,
    text: `${title} ${subtitle}`,
    action,
  });
}

const mini = new MiniSearch<SearchDoc>({
  fields: ["title", "subtitle", "text"],
  storeFields: [
    "id",
    "kind",
    "title",
    "subtitle",
    "slug",
    "nodeId",
    "decisionIndex",
    "tech",
    "action",
  ],
  searchOptions: {
    prefix: true,
    fuzzy: 0.2,
    boost: { title: 3, subtitle: 1.5 },
  },
});
mini.addAll(docs);

const DEFAULT_IDS = new Set([
  ...allSubsystems.map((s) => `sub-${s.slug}`),
  "act-resume",
  "act-email",
  "act-reader",
  "act-theme",
  "act-github",
  "act-linkedin",
]);

export const defaultDocs: SearchDoc[] = docs.filter((d) => DEFAULT_IDS.has(d.id));

export function searchDocs(query: string): SearchDoc[] {
  if (query.trim() === "") return defaultDocs;
  return mini.search(query).slice(0, 24) as unknown as SearchDoc[];
}
