import { NextResponse } from "next/server";

import { subsystems } from "@/content";
import type { Slug } from "@/content/types";
import type { ServiceStatus, StatusPayload } from "@/lib/status";

export const dynamic = "force-dynamic";

const PROBE_TIMEOUT_MS = 5000;
const CACHE_MS = 60_000;

const FINDSPACE_PROBE = "https://findspace-backend.onrender.com/api/listings?page=0&size=1";
const CHAINVOTE_SITE = "https://blockchain-voting-self.vercel.app";
const AMOY_RPC = "https://polygon-amoy-bor-rpc.publicnode.com";

type ProbeResult =
  | { kind: "http"; status: number; ms: number; body: string }
  | { kind: "timeout" }
  | { kind: "unreachable" };

async function probe(url: string, init?: RequestInit): Promise<ProbeResult> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      cache: "no-store",
    });
    const body = await res.text();
    return { kind: "http", status: res.status, ms: Date.now() - started, body };
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") return { kind: "timeout" };
    return { kind: "unreachable" };
  }
}

async function checkFindspace(): Promise<ServiceStatus> {
  const result = await probe(FINDSPACE_PROBE);
  switch (result.kind) {
    case "http":
      return { state: "live", detail: `responded in ${result.ms} ms`, ms: result.ms };
    case "timeout":
      // Render's free tier sleeps; a silent 5 seconds is the cold start, not an outage.
      return { state: "waking", detail: "no response in 5 s, cold start likely" };
    case "unreachable":
      return { state: "offline", detail: "did not respond" };
  }
}

async function checkChainvote(): Promise<ServiceStatus> {
  const [site, rpc] = await Promise.all([
    probe(CHAINVOTE_SITE),
    probe(AMOY_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
    }),
  ]);

  let blockNote = "RPC probe failed";
  if (rpc.kind === "http") {
    try {
      const parsed = JSON.parse(rpc.body) as { result?: string };
      if (typeof parsed.result === "string") {
        blockNote = `Amoy block ${Number.parseInt(parsed.result, 16)}`;
      }
    } catch {
      // Keep the failure note; a malformed RPC body is not a block number.
    }
  }

  switch (site.kind) {
    case "http":
      return { state: "live", detail: `responded in ${site.ms} ms, ${blockNote}`, ms: site.ms };
    case "timeout":
      return { state: "unknown", detail: "no response in 5 s" };
    case "unreachable":
      return { state: "offline", detail: "did not respond" };
  }
}

let cached: { at: number; payload: StatusPayload } | null = null;

export async function GET() {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return NextResponse.json(cached.payload, {
      headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  }

  const [findspace, chainvote] = await Promise.all([checkFindspace(), checkChainvote()]);

  const services = {} as Record<Slug, ServiceStatus>;
  for (const s of subsystems) {
    if (s.slug === "findspace") services[s.slug] = findspace;
    else if (s.slug === "chainvote") services[s.slug] = chainvote;
    else services[s.slug] = { state: "unknown", detail: s.staticStatusNote ?? "not deployed" };
  }

  const payload: StatusPayload = { checkedAt: new Date().toISOString(), services };
  cached = { at: Date.now(), payload };

  return NextResponse.json(payload, {
    headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}
