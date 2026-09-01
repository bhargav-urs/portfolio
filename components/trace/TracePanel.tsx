"use client";

import { useEffect, useRef, useState } from "react";

import { Lamp } from "@/components/Lamp";
import { recordedTraces } from "@/content/traces";
import type { Subsystem } from "@/content/types";

type Phase = { name: string; ms: number };

type TraceSuccess = {
  ok: true;
  status: number;
  request: string;
  phases: Phase[];
  totalMs: number;
  bodyLines: string[];
  coldStart: boolean;
};

type TraceFailure = {
  ok: false;
  error: "timeout" | "network";
  elapsedMs: number;
};

type TraceResponse = TraceSuccess | TraceFailure;

const SEGMENT_MIX = [85, 62, 45, 28, 14];

function ModeChip({ mode }: { mode: "live" | "recorded" }) {
  return (
    <span
      className="px-1.5 py-0.5 text-xs font-medium text-ink-soft"
      style={{ boxShadow: "inset 0 0 0 1px var(--hairline-strong)", borderRadius: 2 }}
    >
      {mode}
    </span>
  );
}

function TimingBar({
  phases,
  totalMs,
  request,
  status,
  bodyLines,
  footnote,
}: {
  phases: Phase[];
  totalMs: number;
  request: string;
  status?: number;
  bodyLines: string[];
  footnote?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? bodyLines : bodyLines.slice(0, 12);
  const phaseTotal = Math.max(
    1,
    phases.reduce((sum, p) => sum + p.ms, 0),
  );

  return (
    <div className="mt-3">
      <p className="font-machine text-xs text-ink-soft">
        {request}
        {status !== undefined ? `  ${status}` : ""}
        {"  "}
        <span className="tnum">{totalMs} ms total</span>
      </p>
      <div
        className="inset mt-2 flex h-4 w-full overflow-hidden"
        role="img"
        aria-label={`Timing: ${phases.map((p) => `${p.name} ${p.ms} milliseconds`).join(", ")}, ${totalMs} milliseconds total`}
      >
        {phases.map((p, i) => (
          <div
            key={p.name}
            style={{
              width: `${Math.max(1.5, (p.ms / phaseTotal) * 100)}%`,
              background: `color-mix(in srgb, var(--ch) ${SEGMENT_MIX[i % SEGMENT_MIX.length]}%, var(--panel-raised))`,
              boxShadow: i > 0 ? "inset 1px 0 0 var(--panel-recess)" : undefined,
            }}
          />
        ))}
      </div>
      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {phases.map((p, i) => (
          <div key={p.name} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5"
              style={{
                background: `color-mix(in srgb, var(--ch) ${SEGMENT_MIX[i % SEGMENT_MIX.length]}%, var(--panel-raised))`,
              }}
            />
            <dt className="text-xs text-ink-soft">{p.name}</dt>
            <dd className="font-machine tnum text-xs">{p.ms} ms</dd>
          </div>
        ))}
      </dl>
      {shown.length > 0 ? (
        <pre className="inset mt-3 overflow-x-auto p-3 font-machine text-xs leading-relaxed">
          {shown.join("\n")}
        </pre>
      ) : null}
      {bodyLines.length > 12 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          {expanded ? "Show fewer lines" : `Show all ${bodyLines.length} lines`}
        </button>
      ) : null}
      {footnote ? <p className="mt-2 text-xs text-ink-soft">{footnote}</p> : null}
    </div>
  );
}

function LiveTrace({ target, description }: { target: string; description: string }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "failed">("idle");
  const [result, setResult] = useState<TraceResponse | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const run = async () => {
    setState("running");
    setResult(null);
    setElapsed(0);
    const started = performance.now();
    timer.current = setInterval(() => {
      setElapsed(Math.round((performance.now() - started) / 100) / 10);
    }, 100);
    try {
      const controller = new AbortController();
      const kill = setTimeout(() => controller.abort(), 15000);
      const res = await fetch("/api/trace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target }),
        signal: controller.signal,
      });
      clearTimeout(kill);
      const data = (await res.json()) as TraceResponse;
      setResult(data);
      setState(data.ok ? "done" : "failed");
    } catch {
      setResult({ ok: false, error: "timeout", elapsedMs: Math.round(performance.now() - started) });
      setState("failed");
    } finally {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }
  };

  const waking =
    (state === "running" && elapsed > 3) ||
    (result !== null && !result.ok && result.error === "timeout") ||
    (result !== null && result.ok && result.coldStart);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={state === "running"}
          className="plate px-4 py-1.5 text-sm font-medium hover:text-channel-text disabled:opacity-60"
        >
          {state === "running" ? (
            <span className="tnum">Running, {elapsed.toFixed(1)} s</span>
          ) : state === "idle" ? (
            "Run trace"
          ) : (
            "Run again"
          )}
        </button>
        <span className="text-xs text-ink-soft">{description}</span>
      </div>
      {waking ? (
        <div className="mt-3 flex items-center gap-2">
          <Lamp state="waking" />
          <p className="text-sm">Free tier instance, cold start in progress.</p>
        </div>
      ) : null}
      {result?.ok ? (
        <TimingBar
          phases={result.phases}
          totalMs={result.totalMs}
          request={result.request}
          status={result.status}
          bodyLines={result.bodyLines}
          footnote={
            result.coldStart
              ? "That total includes the cold start. Run it again for the warm number."
              : undefined
          }
        />
      ) : null}
      {result !== null && !result.ok ? (
        <p className="mt-2 text-sm text-ink-soft">
          {result.error === "timeout" ? (
            <>
              No response within the timeout ({Math.round(result.elapsedMs / 100) / 10} s
              elapsed). On this free tier that usually means the instance is still waking;
              run it again in a few seconds.
            </>
          ) : (
            <>The service did not respond. That is the honest state of it right now.</>
          )}
        </p>
      ) : null}
    </div>
  );
}

export function TracePanel({ subsystem }: { subsystem: Subsystem }) {
  const trace = subsystem.trace;
  const recorded = recordedTraces[subsystem.slug];

  return (
    <section className="mt-6" aria-label={`${subsystem.name} request trace`}>
      <div className="mb-3 flex items-center gap-2.5">
        <h2 className="text-md font-semibold">Trace</h2>
        <ModeChip mode={trace.mode} />
      </div>
      {trace.mode === "live" ? (
        <LiveTrace target={trace.target} description={trace.description} />
      ) : recorded ? (
        <div>
          <p className="text-xs text-ink-soft">{trace.description}</p>
          <TimingBar
            phases={recorded.phases}
            totalMs={recorded.totalMs}
            request={recorded.request}
            bodyLines={recorded.responseLines}
            footnote={`Captured from a local run on ${recorded.capturedOn}.`}
          />
        </div>
      ) : (
        <div className="inset px-5 py-6">
          <p className="text-sm text-ink-soft">{trace.description}</p>
          <p className="mt-2 text-xs text-ink-soft">
            No capture is checked in yet, so nothing is shown. A recorded trace only ever
            comes from a timed local run; it is never invented.
          </p>
        </div>
      )}
    </section>
  );
}
