"use client";

import { Command } from "cmdk";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useShellState } from "@/components/shell/ShellState";
import { profile, techRegistry } from "@/content/client";
import { emitDecisionFocus, emitNodeFocus } from "@/lib/events";
import { toggleFinish } from "@/lib/finish";
import { searchDocs, type SearchDoc } from "@/lib/searchIndex";

const GROUP_ORDER: Array<{ kind: SearchDoc["kind"]; label: string }> = [
  { kind: "subsystem", label: "Subsystems" },
  { kind: "node", label: "Architecture nodes" },
  { kind: "decision", label: "Decisions" },
  { kind: "tech", label: "Stack" },
  { kind: "experience", label: "Experience" },
  { kind: "action", label: "Go" },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { setTech } = useShellState();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = searchDocs(query);

  const perform = (doc: SearchDoc) => {
    const here = (slug: string) => pathname === `/s/${slug}`;
    switch (doc.kind) {
      case "subsystem":
        if (doc.slug) router.push(`/s/${doc.slug}`);
        break;
      case "node":
        if (doc.slug && doc.nodeId) {
          if (here(doc.slug)) {
            emitNodeFocus({ slug: doc.slug, nodeId: doc.nodeId });
          } else {
            router.push(`/s/${doc.slug}?node=${encodeURIComponent(doc.nodeId)}`);
          }
        }
        break;
      case "decision":
        if (doc.slug && doc.decisionIndex !== undefined) {
          if (here(doc.slug)) {
            emitDecisionFocus({ slug: doc.slug, index: doc.decisionIndex });
          } else {
            router.push(`/s/${doc.slug}?tab=decisions&d=${doc.decisionIndex}`);
          }
        }
        break;
      case "tech": {
        if (!doc.tech) break;
        const entry = techRegistry.get(doc.tech);
        const onSubsystemUsingIt =
          entry?.uses.some((u) => here(u.slug)) ?? false;
        // Lighting a chip only means something on a plate that has the
        // technology in its schematic, so from anywhere else the palette
        // lands on a subsystem that actually uses it.
        if (!onSubsystemUsingIt && entry?.uses[0]) {
          router.push(`/s/${entry.uses[0].slug}?tech=${encodeURIComponent(doc.tech)}`);
        } else {
          setTech(doc.tech);
        }
        break;
      }
      case "experience":
        router.push("/work");
        break;
      case "action":
        switch (doc.action) {
          case "resume":
            window.open(profile.resumeHref, "_blank", "noopener,noreferrer");
            break;
          case "email":
            window.location.href = `mailto:${profile.email}`;
            break;
          case "github":
            window.open(profile.github.href, "_blank", "noopener,noreferrer");
            break;
          case "linkedin":
            window.open(profile.linkedin.href, "_blank", "noopener,noreferrer");
            break;
          case "theme":
            toggleFinish();
            break;
          case "reader":
            router.push("/?view=reader");
            break;
          case undefined:
            break;
        }
        break;
    }
  };

  const run = (doc: SearchDoc) => {
    onOpenChange(false);
    perform(doc);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      shouldFilter={false}
      label="Search the console"
      className="fixed inset-0 z-40"
    >
      <div
        className="absolute inset-0"
        style={{ background: "color-mix(in srgb, var(--ink) 24%, transparent)" }}
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      <div className="plate absolute left-1/2 top-[12vh] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2">
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search subsystems, nodes, decisions, stack, experience"
          className="hairline-b w-full bg-transparent px-4 py-3 text-base outline-none placeholder:text-ink-soft"
        />
        <Command.List className="max-h-[55vh] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-sm text-ink-soft">
            Nothing matches that.
          </Command.Empty>
          {GROUP_ORDER.map(({ kind, label }) => {
            const items = results.filter((r) => r.kind === kind);
            if (items.length === 0) return null;
            return (
              <Command.Group
                key={kind}
                heading={label}
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-ink-soft"
              >
                {items.map((doc) => (
                  <Command.Item
                    key={doc.id}
                    value={doc.id}
                    onSelect={() => run(doc)}
                    className="flex cursor-pointer items-baseline justify-between gap-4 rounded-plate px-3 py-2 text-sm data-[selected=true]:bg-recess"
                  >
                    <span>{doc.title}</span>
                    <span className="shrink-0 text-xs text-ink-soft">{doc.subtitle}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
