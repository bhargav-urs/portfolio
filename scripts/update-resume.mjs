// Replaces the served resume with a new PDF and removes the old copy.
// Usage: npm run resume -- /path/to/New_Resume.pdf
// The public URL stays /resume.pdf, so nothing else needs to change.

import { copyFileSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("usage: npm run resume -- /path/to/New_Resume.pdf");
  process.exit(1);
}
const from = resolve(src);
if (!existsSync(from) || !from.toLowerCase().endsWith(".pdf")) {
  console.error(`not a PDF on disk: ${from}`);
  process.exit(1);
}
const dest = resolve(import.meta.dirname, "../public/resume.pdf");
if (existsSync(dest)) rmSync(dest);
copyFileSync(from, dest);
console.log(`resume replaced: ${from} -> public/resume.pdf`);
console.log("redeploy to publish it. the old copy is gone from the site.");
