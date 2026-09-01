// Captures one real timed request against a locally running service and
// prints a RecordedTrace object to paste into content/traces.ts.
// Usage: node scripts/capture-trace.mjs http://localhost:8080/api/health

import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const target = process.argv[2];
if (!target) {
  console.error("usage: node scripts/capture-trace.mjs <url>");
  process.exit(1);
}

const url = new URL(target);
const req = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, { method: "GET" });

const t0 = performance.now();
let tLookup = 0;
let tConnect = 0;
let tSecure = 0;
let tFirstByte = 0;

req.on("socket", (socket) => {
  socket.on("lookup", () => (tLookup = performance.now()));
  socket.on("connect", () => (tConnect = performance.now()));
  socket.on("secureConnect", () => (tSecure = performance.now()));
});

req.on("response", (res) => {
  tFirstByte = performance.now();
  const chunks = [];
  res.on("data", (c) => chunks.push(c));
  res.on("end", () => {
    const tEnd = performance.now();
    const body = Buffer.concat(chunks).toString("utf8");
    const connectBase = tLookup || t0;
    const secureBase = tSecure || tConnect || connectBase;
    const phases = [
      { name: "dns", ms: Math.max(0, Math.round(tLookup ? tLookup - t0 : 0)) },
      { name: "connect", ms: Math.max(0, Math.round((tConnect || connectBase) - connectBase)) },
      ...(tSecure ? [{ name: "tls", ms: Math.max(0, Math.round(tSecure - tConnect)) }] : []),
      { name: "server", ms: Math.max(0, Math.round(tFirstByte - secureBase)) },
      { name: "transfer", ms: Math.max(0, Math.round(tEnd - tFirstByte)) },
    ];
    const record = {
      capturedOn: new Date().toISOString().slice(0, 10),
      request: `GET ${url.pathname}${url.search}`,
      phases,
      totalMs: Math.round(tEnd - t0),
      responseLines: body.split("\n").slice(0, 12),
    };
    console.log(JSON.stringify(record, null, 2));
  });
});

req.on("error", (err) => {
  console.error(`request failed: ${err.message}`);
  process.exit(1);
});

req.end();
