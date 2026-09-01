# Portfolio console

My personal engineering portfolio, built as a mission console rather than a landing page.
Each of my five shipped systems renders as a subsystem: a clickable architecture schematic,
the engineering decisions behind it with their tradeoffs, honest live status, and a
request trace you can fire at the real deployments.

## Running it

```
npm install
npm run dev
```

Checks:

```
npm run typecheck
npm run lint
npm run build
```

## Structure

- `content/` holds every subsystem, the work ledger, and the profile as typed TypeScript
  modules. `content/index.ts` validates all of it with zod at build time, so a missing
  field is a build failure, not a broken page.
- `components/schematic/` is the hand-rolled SVG schematic engine: node shapes by kind,
  orthogonal edge routing, keyboard navigation along the wires, and a screen reader
  outline that describes the same system the drawing shows.
- `app/api/status` pings my deployed services and reports live, waking, offline, or
  unknown. Failures return unknown, never a fabricated green.
- `app/api/trace` proxies one allowlisted read-only request to a live backend and
  returns per-hop timings. Cold starts are shown as cold starts.

## Updating the resume

```
npm run resume -- /path/to/New_Resume.pdf
```

That replaces `public/resume.pdf` in place; the public URL stays `/resume.pdf` and the
old copy is gone after the next deploy.

## Recorded traces

Subsystems that are not publicly deployed show a recorded trace instead of a live one.
Captures come only from a real local run:

```
node scripts/capture-trace.mjs http://localhost:8080/api/health
```

Paste the printed object into `content/traces.ts` keyed by slug. Until a capture is
checked in, the whole trace control is hidden for that subsystem; adding the entry
restores it, labelled `recorded`. Nothing is ever shown that was not measured.

## Deploying

Vercel, no configuration beyond the repo itself. Set `NEXT_PUBLIC_SITE_URL` to the
production URL so metadata, the sitemap, and the OG images carry the right host.
