// Reads the PNG/JPEG files you dropped into public/screens/<slug>/ and prints
// ready-to-paste `screens` entries with real pixel dimensions, so nothing has
// to be measured by hand.
//
// Usage: npm run screens            (every subsystem)
//        npm run screens findspace  (one subsystem)

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SLUGS = ["findspace", "convergeai", "mappedin", "chainvote", "agripulse"];
const root = resolve(import.meta.dirname, "../public/screens");

function pngSize(buf) {
  // IHDR width/height are the two big-endian uint32s at byte 16.
  if (buf.length < 24) return null;
  const sig = buf.subarray(0, 8).toString("hex");
  if (sig !== "89504e470d0a1a0a") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    // SOF0..SOF15, excluding the non-dimensional DHT/JPG/DAC markers.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

function sizeOf(file) {
  const buf = readFileSync(file);
  return pngSize(buf) ?? jpegSize(buf);
}

/** "02-listing-detail.png" -> "Listing detail" */
function titleFrom(name) {
  const base = name.replace(/\.[a-z]+$/i, "").replace(/^\d+[-_]?/, "");
  const words = base.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const only = process.argv[2];
const targets = only ? SLUGS.filter((s) => s === only) : SLUGS;
if (only && targets.length === 0) {
  console.error(`unknown subsystem: ${only}`);
  console.error(`expected one of: ${SLUGS.join(", ")}`);
  process.exit(1);
}

let found = 0;
for (const slug of targets) {
  const dir = join(root, slug);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir)
    .filter((f) => /\.(png|jpe?g)$/i.test(f))
    .sort();
  if (files.length === 0) continue;

  console.log(`\n// ---- ${slug}: paste into content/subsystems/${slug}.ts ----`);
  console.log("  screens: [");
  for (const f of files) {
    const dims = sizeOf(join(dir, f));
    if (!dims) {
      console.log(`    // could not read dimensions: ${f}`);
      continue;
    }
    found++;
    const title = titleFrom(f);
    const orient = dims.height > dims.width ? "  // portrait" : "";
    console.log("    {");
    console.log(`      src: "/screens/${slug}/${f}",`);
    console.log(`      alt: "${title}",`);
    console.log(`      caption: "${title}",`);
    console.log(`      width: ${dims.width},`);
    console.log(`      height: ${dims.height},${orient}`);
    console.log("    },");
  }
  console.log("  ],");
}

if (found === 0) {
  console.log("No screenshots found. Drop files into public/screens/<slug>/ and run this again.");
} else {
  console.log(`\n// ${found} capture(s). Replace the alt and caption text before committing.`);
}
