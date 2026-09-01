"use client";

import { useEffect, useState } from "react";

import { Lamp } from "@/components/Lamp";
import { useStatus } from "@/components/StatusProvider";
import { NodeDetailPanel } from "@/components/schematic/NodeDetailPanel";
import { Schematic, SchematicOutline } from "@/components/schematic/Schematic";
import { DecisionsTab } from "@/components/plate/DecisionsTab";
import { MetricsTab } from "@/components/plate/MetricsTab";
import { ScreensTab } from "@/components/plate/ScreensTab";
import { StackTab } from "@/components/plate/StackTab";
import { Tabs, type TabId } from "@/components/plate/Tabs";
import { useShellState } from "@/components/shell/ShellState";
import { TracePanel } from "@/components/trace/TracePanel";
import { litNodesFor, techRegistry } from "@/content/client";
import type { ExternalLink, Subsystem } from "@/content/types";
import {
  DECISION_EVENT,
  NODE_EVENT,
  type DecisionFocusDetail,
  type NodeFocusDetail,
} from "@/lib/events";

function ExtLink({ link }: { link: ExternalLink }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-channel-text"
    >
      {link.label}
      <span className="ml-1.5 text-xs text-ink-soft no-underline">{link.host}</span>
    </a>
  );
}

const TAB_IDS: TabId[] = ["decisions", "stack", "metrics", "screens"];

export function SubsystemPlate({ subsystem }: { subsystem: Subsystem }) {
  const { serviceFor, payload } = useStatus();
  const { tech, setTech } = useShellState();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("decisions");
  const [highlightDecision, setHighlightDecision] = useState<number | null>(null);

  // Deep links: /s/x?node=id, ?tab=stack, ?d=2. Read once per plate mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const node = params.get("node");
    if (node && subsystem.nodes.some((n) => n.id === node)) {
      setSelectedNodeId(node);
    }
    const t = params.get("tab");
    if (t && (TAB_IDS as string[]).includes(t)) {
      setTab(t as TabId);
    }
    const d = params.get("d");
    if (d !== null) {
      const index = Number.parseInt(d, 10);
      if (Number.isInteger(index) && index >= 0 && index < subsystem.decisions.length) {
        setTab("decisions");
        setHighlightDecision(index);
      }
    }
  }, [subsystem]);

  // The palette lands here after (or without) a route change.
  useEffect(() => {
    const onNode = (e: Event) => {
      const detail = (e as CustomEvent<NodeFocusDetail>).detail;
      if (detail.slug === subsystem.slug) setSelectedNodeId(detail.nodeId);
    };
    const onDecision = (e: Event) => {
      const detail = (e as CustomEvent<DecisionFocusDetail>).detail;
      if (detail.slug === subsystem.slug) {
        setTab("decisions");
        setHighlightDecision(detail.index);
      }
    };
    window.addEventListener(NODE_EVENT, onNode);
    window.addEventListener(DECISION_EVENT, onDecision);
    return () => {
      window.removeEventListener(NODE_EVENT, onNode);
      window.removeEventListener(DECISION_EVENT, onDecision);
    };
  }, [subsystem.slug]);

  const service = serviceFor(subsystem.slug);
  const checked = subsystem.statusMode === "checked";
  const lampState = checked ? service.state : "unknown";
  const lampWord = checked ? service.state : (subsystem.staticStatusNote ?? "not deployed");

  const selectedNode = subsystem.nodes.find((n) => n.id === selectedNodeId) ?? null;
  const litNodes = litNodesFor(subsystem.slug, tech);
  const activeTech = tech ? techRegistry.get(tech) : undefined;

  const closeDetail = () => {
    const id = selectedNodeId;
    setSelectedNodeId(null);
    if (id) {
      document.getElementById(`node-${subsystem.slug}-${id}`)?.focus();
    }
  };

  return (
    <article className={`channel-${subsystem.slug} px-4 py-6 md:px-8 md:py-8`}>
      <header className="border-b-2 border-channel pb-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="condensed text-2xl font-semibold">{subsystem.name}</h1>
          <Lamp state={lampState} word={lampWord} settling={checked && payload !== null} />
          {checked && payload !== null && service.detail ? (
            <span className="font-machine text-xs text-ink-soft">{service.detail}</span>
          ) : null}
        </div>
        <p className="mt-2 max-w-[68ch] text-md text-ink-soft">{subsystem.oneLine}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm">
          {subsystem.live ? <ExtLink link={subsystem.live} /> : null}
          <ExtLink link={subsystem.repo} />
          {subsystem.extraLinks?.map((l) => <ExtLink key={l.href} link={l} />)}
        </div>
        {subsystem.coldStartNote ? (
          <p className="mt-1.5 text-xs text-ink-soft">{subsystem.coldStartNote}</p>
        ) : null}
        {subsystem.extraLinks?.map((l) =>
          l.note ? (
            <p key={`${l.href}-note`} className="mt-1.5 text-xs text-ink-soft">
              {l.label}: {l.note}
            </p>
          ) : null,
        )}
      </header>

      {activeTech ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span>
            Filter: <strong className="font-medium text-channel-text">{activeTech.label}</strong>.
            Nodes running it are lit; rail entries without it are dimmed.
          </span>
          <button
            type="button"
            onClick={() => setTech(null)}
            className="text-ink-soft underline underline-offset-2 hover:text-ink"
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="mt-5">
        <Schematic
          subsystem={subsystem}
          selectedId={selectedNodeId}
          onSelect={setSelectedNodeId}
          litNodes={litNodes}
        />
        <SchematicOutline subsystem={subsystem} />
      </div>

      {subsystem.sequence ? (
        <ol className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <span className="text-xs text-ink-soft">{subsystem.sequence.title}:</span>
          {subsystem.sequence.steps.map((step, i) => (
            <li key={step} className="flex items-center gap-1.5 text-sm">
              <span
                aria-hidden="true"
                className="tnum inline-flex h-5 w-5 items-center justify-center text-xs font-semibold text-channel-text"
                style={{ boxShadow: "inset 0 0 0 1.25px var(--ch-text)" }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      ) : null}

      <NodeDetailPanel node={selectedNode} onClose={closeDetail} />

      <TracePanel subsystem={subsystem} />

      <div className="mt-8">
        <Tabs value={tab} onChange={setTab} idBase={subsystem.slug} />
        <div
          role="tabpanel"
          id={`${subsystem.slug}-panel-${tab}`}
          aria-labelledby={`${subsystem.slug}-tab-${tab}`}
          className="mt-5"
        >
          {tab === "decisions" ? (
            <DecisionsTab subsystem={subsystem} highlightIndex={highlightDecision} />
          ) : tab === "stack" ? (
            <StackTab subsystem={subsystem} tech={tech} setTech={setTech} />
          ) : tab === "metrics" ? (
            <MetricsTab subsystem={subsystem} />
          ) : (
            <ScreensTab subsystem={subsystem} />
          )}
        </div>
      </div>
    </article>
  );
}
