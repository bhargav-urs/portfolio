import { request as httpsRequest } from "node:https";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_LINES = 40;
const MAX_LINE_CHARS = 200;

const bodySchema = z.object({
  target: z.enum(["findspace", "chainvote", "convergeai"]),
});

/*
  Rate limiting. In-memory and per instance, which is enough here: the
  point is that this page can never hammer the free-tier backends it
  traces, not to survive a distributed flood.
*/
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_IP = 5;
const RATE_MAX_GLOBAL = 30;

const hitsByIp = new Map<string, number[]>();
const globalHits: number[] = [];

function prune(arr: number[], cutoff: number): void {
  while (arr.length > 0 && (arr[0] ?? Infinity) <= cutoff) arr.shift();
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function allowRequest(ip: string): boolean {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  prune(globalHits, cutoff);
  if (globalHits.length >= RATE_MAX_GLOBAL) return false;
  let mine = hitsByIp.get(ip);
  if (!mine) {
    mine = [];
    hitsByIp.set(ip, mine);
  }
  prune(mine, cutoff);
  if (mine.length >= RATE_MAX_PER_IP) return false;
  const now = Date.now();
  mine.push(now);
  globalHits.push(now);
  if (hitsByIp.size > 1000) {
    for (const [key, arr] of hitsByIp) {
      prune(arr, cutoff);
      if (arr.length === 0) hitsByIp.delete(key);
    }
  }
  return true;
}

type TargetSpec = {
  url: string;
  method: "GET" | "POST";
  headers?: Record<string, string>;
  payload?: string;
  requestLabel: string;
  /** Tried in order when the previous host fails, mirroring the app's own pool. */
  fallbacks?: string[];
};

const RPC_PAYLOAD = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "eth_blockNumber",
  params: [],
});

const TARGETS: Record<"findspace" | "chainvote" | "convergeai", TargetSpec> = {
  findspace: {
    url: "https://findspace-backend.onrender.com/api/listings?page=0&size=1",
    method: "GET",
    requestLabel: "GET /api/listings?page=0&size=1 (findspace-backend.onrender.com)",
  },
  convergeai: {
    url: "https://3-21-114-104.sslip.io/actuator/health",
    method: "GET",
    requestLabel: "GET /actuator/health (3-21-114-104.sslip.io)",
  },
  chainvote: {
    url: "https://polygon-amoy-bor-rpc.publicnode.com",
    method: "POST",
    headers: { "content-type": "application/json" },
    payload: RPC_PAYLOAD,
    requestLabel: "POST eth_blockNumber (polygon-amoy-bor-rpc.publicnode.com)",
    fallbacks: ["https://polygon-amoy.drpc.org"],
  },
};

type Phase = { name: string; ms: number };

type Timed = {
  status: number;
  phases: Phase[];
  totalMs: number;
  body: string;
};

function timedRequest(spec: TargetSpec, url: string): Promise<Timed> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest(parsed, {
      method: spec.method,
      headers: spec.headers,
    });

    const t0 = performance.now();
    let tLookup = 0;
    let tConnect = 0;
    let tSecure = 0;
    let settled = false;

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      req.destroy();
      reject(err);
    };

    const timeout = setTimeout(() => fail(new Error("timeout")), TIMEOUT_MS);

    req.on("socket", (socket) => {
      socket.once("lookup", () => {
        tLookup = performance.now();
      });
      socket.once("connect", () => {
        tConnect = performance.now();
      });
      socket.once("secureConnect", () => {
        tSecure = performance.now();
      });
    });

    req.on("response", (res) => {
      const tFirstByte = performance.now();
      const chunks: Buffer[] = [];
      let bytes = 0;
      res.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes <= MAX_BODY_BYTES) chunks.push(chunk);
      });
      res.on("end", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        const tEnd = performance.now();
        const lookupEnd = tLookup || t0;
        const connectEnd = tConnect || lookupEnd;
        const secureEnd = tSecure || connectEnd;
        const phases: Phase[] = [
          { name: "dns", ms: Math.max(0, Math.round(lookupEnd - t0)) },
          { name: "connect", ms: Math.max(0, Math.round(connectEnd - lookupEnd)) },
          { name: "tls", ms: Math.max(0, Math.round(secureEnd - connectEnd)) },
          { name: "server", ms: Math.max(0, Math.round(tFirstByte - secureEnd)) },
          { name: "transfer", ms: Math.max(0, Math.round(tEnd - tFirstByte)) },
        ];
        resolve({
          status: res.statusCode ?? 0,
          phases,
          totalMs: Math.round(tEnd - t0),
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
      res.on("error", fail);
    });

    req.on("error", fail);
    if (spec.payload) req.write(spec.payload);
    req.end();
  });
}

function toLines(body: string): string[] {
  let text = body;
  try {
    text = JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    // Not JSON; ship it as it came.
  }
  return text
    .split("\n")
    .slice(0, MAX_LINES)
    .map((line) => (line.length > MAX_LINE_CHARS ? `${line.slice(0, MAX_LINE_CHARS)}…` : line));
}

export async function POST(request: Request) {
  if (!allowRequest(clientIp(request))) {
    return NextResponse.json(
      { ok: false, error: "rate-limit", elapsedMs: 0 },
      { status: 429 },
    );
  }

  let parsedBody: z.infer<typeof bodySchema>;
  try {
    parsedBody = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "network", elapsedMs: 0 }, { status: 400 });
  }

  const spec = TARGETS[parsedBody.target];
  const urls = [spec.url, ...(spec.fallbacks ?? [])];
  const started = performance.now();
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const timed = await timedRequest(spec, url);
      return NextResponse.json({
        ok: true,
        status: timed.status,
        request: spec.requestLabel,
        phases: timed.phases,
        totalMs: timed.totalMs,
        bodyLines: toLines(timed.body),
        coldStart: timed.totalMs > 3000,
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("network");
    }
  }

  const elapsedMs = Math.round(performance.now() - started);
  return NextResponse.json({
    ok: false,
    error: lastError?.message === "timeout" ? "timeout" : "network",
    elapsedMs,
  });
}
