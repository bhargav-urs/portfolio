import type { Subsystem } from "../types";

export const findspace: Subsystem = {
  slug: "findspace",
  name: "FindSpace",
  oneLine:
    "A room rental marketplace where tenants search listings, message landlords directly, and landlords manage their own inventory.",
  statusMode: "checked",
  coldStartNote:
    "Runs on Render's free tier; the first request after idle takes roughly 30 seconds.",
  live: {
    label: "Live",
    href: "https://findspace-five.vercel.app",
    host: "findspace-five.vercel.app",
  },
  repo: {
    label: "Repository",
    href: "https://github.com/bhargav-urs/findspace",
    host: "github.com",
  },
  canvas: { w: 980, h: 560 },
  boundaries: [
    {
      id: "render",
      label: "Render container",
      note: "Spring Boot 3.2 REST API, Docker",
      x: 330,
      y: 64,
      w: 300,
      h: 440,
    },
  ],
  nodes: [
    {
      id: "client",
      label: "Next.js 14 client",
      sub: "Vercel, Pages Router",
      kind: "client",
      x: 40,
      y: 110,
      w: 210,
      h: 72,
      detail: {
        role: "Renders search, listing detail, messaging, and the landlord dashboard, and holds the auth token for every API call.",
        why: "File-based routing and per-page data fetching fit a marketplace where most pages are either a filtered list or a detail view, and Vercel deploys it on every push without a server to manage.",
        rejected:
          "A single React bundle served from the Spring Boot container. It would couple frontend deploys to backend deploys and give up per-route code splitting for nothing in return.",
        breaks:
          "The Pages Router has no server components, so every page ships its data-fetching code to the browser. As page count grows the shared bundle grows with it, and the App Router migration becomes the real fix.",
      },
    },
    {
      id: "axios",
      label: "Axios + JWT interceptor",
      kind: "client",
      x: 40,
      y: 260,
      w: 210,
      h: 64,
      detail: {
        role: "Attaches the bearer token to every outgoing request and funnels 401 responses into a single logout path.",
        why: "One interceptor means no fetch call anywhere in the app can forget auth, and expiry handling lives in one file instead of being repeated per request.",
        rejected:
          "Plain fetch wrappers per feature. Less dependency weight, but auth handling gets duplicated and drifts apart the first time two features are edited separately.",
        breaks:
          "The interceptor can only react after a request has already failed. Without refresh token rotation the user is logged out mid-session on expiry; silent refresh is the next step and it belongs in this file.",
      },
    },
    {
      id: "jwtfilter",
      label: "JWT OncePerRequestFilter",
      kind: "service",
      x: 360,
      y: 110,
      w: 240,
      h: 64,
      detail: {
        role: "Validates the bearer token and populates the Spring Security context before any controller method runs.",
        why: "Stateless auth means the API holds no session, so a container restart or a second instance never logs anyone out.",
        rejected:
          "Server-side sessions. Simpler to revoke, but they pin a user to an instance and make horizontal scaling a sticky-session problem.",
        breaks:
          "There is no revocation path. A stolen token stays valid until expiry. The next step is a token version column checked on each request, which trades back part of the statelessness.",
      },
    },
    {
      id: "service",
      label: "Service layer",
      kind: "service",
      x: 360,
      y: 214,
      w: 240,
      h: 56,
      detail: {
        role: "Holds the business rules: who may edit a listing, when a delete becomes a soft delete, what a conversation may contain.",
        why: "Controllers stay thin, and the runtime delete policy (hide when history exists, remove when it does not) lives in one method instead of leaking into SQL or the client.",
        rejected:
          "Fat controllers writing straight to repositories. Fewer layers, but the soft-delete rule alone touches listings, conversations, and messages, and that logic needs a single owner.",
        breaks:
          "Everything is synchronous request-response. The first feature that needs fan-out, like notifying a landlord of a new message, wants an outbox or a queue rather than another call in the request path.",
      },
    },
    {
      id: "repos",
      label: "JPA repositories",
      kind: "service",
      x: 360,
      y: 310,
      w: 240,
      h: 56,
      detail: {
        role: "Maps the five domain entities to Postgres and generates the queries the service layer asks for.",
        why: "Derived queries and pagination come for free, and the entity model is the one place the schema is described in Java.",
        rejected:
          "Hand-written JDBC. Full control over the SQL, but five entities of CRUD plus paging is exactly the boilerplate JPA exists to remove.",
        breaks:
          "Search runs as a LIKE across three columns through JPA. At real listing volume that is a sequential scan; the fix is a Postgres full-text index behind a native query, not more JPA.",
      },
    },
    {
      id: "hikari",
      label: "HikariCP pool",
      kind: "service",
      x: 360,
      y: 406,
      w: 240,
      h: 64,
      detail: {
        role: "Bounds concurrent database connections from the API.",
        why: "Neon's free tier caps connections, and the default pool size exceeds it, which produces connection refusals under trivial load rather than queueing.",
        rejected:
          "Leaving the default and scaling the database. Correct in production, wrong when the ceiling is a free-tier quota.",
        breaks:
          "A small pool converts a connection shortage into request latency. Under real concurrency this needs a pooler such as PgBouncer in front of Postgres.",
      },
    },
    {
      id: "db",
      label: "PostgreSQL 15",
      sub: "Neon",
      kind: "datastore",
      x: 730,
      y: 396,
      w: 210,
      h: 84,
      detail: {
        role: "The single durable store: users, listings, conversations, messages, and the soft-delete flags.",
        why: "Relational integrity is the workload here. A message must always point at a real conversation and a real listing, and foreign keys enforce that without application code.",
        rejected:
          "A document store. Listings nest nicely as documents, but the message-to-listing-to-user joins are the actual queries, and joins are the thing document stores make you hand-roll.",
        breaks:
          "Neon's free tier caps connections and sleeps when idle. The connection cap is absorbed by the pool; the next real ceilings are storage and the LIKE search, in that order.",
      },
    },
    {
      id: "ci",
      label: "GitHub Actions CI",
      kind: "external",
      x: 730,
      y: 110,
      w: 210,
      h: 64,
      detail: {
        role: "Builds both apps on every push and pull request, so a broken build never reaches a deploy hook.",
        why: "The frontend and the API deploy to different hosts. A shared gate is the only place a cross-cutting break, like a changed response shape, is caught before production.",
        rejected:
          "Deploy-on-push with no CI. Faster, and fine until the first time a build breaks only in production.",
        breaks:
          "The pipeline compiles but does not run integration tests against a real Postgres, so a migration that boots locally can still fail on Neon. Testcontainers in the pipeline is the known fix.",
      },
    },
  ],
  edges: [
    { from: "client", to: "axios", fromSide: "bottom", toSide: "top" },
    {
      from: "axios",
      to: "jwtfilter",
      fromSide: "right",
      toSide: "left",
      label: "REST + JWT",
      bend: 300,
      labelPos: { x: 288, y: 226 },
    },
    { from: "jwtfilter", to: "service", fromSide: "bottom", toSide: "top" },
    { from: "service", to: "repos", fromSide: "bottom", toSide: "top" },
    { from: "repos", to: "hikari", fromSide: "bottom", toSide: "top" },
    { from: "hikari", to: "db", fromSide: "right", toSide: "left", label: "JDBC" },
    {
      from: "ci",
      to: "client",
      fromSide: "top",
      toSide: "top",
      bend: 36,
      dashed: true,
      label: "build + deploy on push",
    },
  ],
  decisions: [
    {
      title: "Delete is a runtime decision",
      decision:
        "Deleting a listing that already has conversations hides it and preserves the message history; a listing with no history is removed outright; editing a hidden listing reactivates it.",
      constraint:
        "Tenants keep message threads that reference listings, so a hard delete would orphan live conversations.",
      rejected: "Always soft-deleting. It leaves orphan rows that nothing will ever read.",
      consequence:
        "Two delete paths to test instead of one, and every listing query has to respect the hidden flag.",
    },
    {
      title: "Nullable column before backfill",
      decision:
        "A live schema migration landed the new column as a nullable wrapper type, so the column could deploy ahead of the data.",
      constraint:
        "Adding a NOT NULL column to an already-populated table crashed Hibernate on boot in production.",
      rejected: "Wiping and reseeding the table. Fine in development, data loss in production.",
      consequence:
        "Application code treats the field as optional until a backfill and a follow-up migration tighten the constraint.",
    },
    {
      title: "Configuration lives in the environment",
      decision:
        "Datasource, JWT secret, and CORS origin are read from environment variables, so dev and prod differ by environment and not by branch.",
      constraint:
        "Three hosts (Vercel, Render, Neon) need different origins and credentials for the same build artifact.",
      rejected: "Per-environment property files in the repository. They leak secrets and they drift.",
      consequence:
        "A missing variable fails at boot rather than at build, so the deploy checklist has to be respected.",
    },
  ],
  limitations: [
    "The backend sleeps on the free tier, so the first request after idle takes roughly 30 seconds.",
    "No refresh token rotation. When a token expires, the session simply ends.",
    "Search is a SQL LIKE across title, address, and description, which will not survive a real listing volume. The next step is a Postgres full-text index.",
  ],
  stack: [
    { tech: "nextjs", label: "Next.js 14 (Pages Router)", group: "frontend", nodes: ["client"] },
    { tech: "react", label: "React 18", group: "frontend", nodes: ["client"] },
    { tech: "typescript", label: "TypeScript 5.4", group: "frontend", nodes: ["client"] },
    { tech: "tailwind", label: "Tailwind CSS 3.4", group: "frontend", nodes: ["client"] },
    { tech: "axios", label: "Axios", group: "frontend", nodes: ["axios"] },
    { tech: "headlessui", label: "Headless UI", group: "frontend", nodes: ["client"] },
    { tech: "heroicons", label: "Heroicons", group: "frontend", nodes: ["client"] },
    { tech: "datefns", label: "date-fns", group: "frontend", nodes: ["client"] },
    { tech: "clsx", label: "clsx", group: "frontend", nodes: ["client"] },
    { tech: "java", label: "Java 17", group: "backend", nodes: ["jwtfilter", "service", "repos"] },
    { tech: "spring-boot", label: "Spring Boot 3.2", group: "backend", nodes: ["jwtfilter", "service", "repos"] },
    { tech: "spring-web", label: "Spring Web", group: "backend", nodes: ["service"] },
    { tech: "spring-security", label: "Spring Security", group: "backend", nodes: ["jwtfilter"] },
    { tech: "spring-data-jpa", label: "Spring Data JPA", group: "backend", nodes: ["repos"] },
    { tech: "hibernate", label: "Hibernate 6", group: "backend", nodes: ["repos"] },
    { tech: "spring-validation", label: "Spring Validation", group: "backend", nodes: ["service"] },
    { tech: "springdoc", label: "springdoc-openapi", group: "backend", nodes: ["service"] },
    { tech: "jjwt", label: "jjwt 0.12", group: "backend", nodes: ["jwtfilter"] },
    { tech: "bcrypt", label: "BCrypt", group: "backend", nodes: ["jwtfilter"] },
    { tech: "postgresql", label: "PostgreSQL 15", group: "data", nodes: ["db"] },
    { tech: "hikaricp", label: "HikariCP", group: "data", nodes: ["hikari"] },
    { tech: "maven", label: "Maven", group: "infra", nodes: ["ci"] },
    { tech: "docker", label: "Docker multi-stage", group: "infra", nodes: ["jwtfilter", "service", "repos", "hikari"] },
    { tech: "docker-compose", label: "Docker Compose", group: "infra", nodes: ["jwtfilter", "service", "repos", "hikari"] },
    { tech: "github-actions", label: "GitHub Actions", group: "infra", nodes: ["ci"] },
    { tech: "vercel", label: "Vercel", group: "infra", nodes: ["client"] },
    { tech: "render", label: "Render", group: "infra", nodes: ["jwtfilter", "service", "repos", "hikari"] },
    { tech: "neon", label: "Neon", group: "data", nodes: ["db"] },
  ],
  metrics: [
    { value: "5", label: "domain entities" },
    { value: "3", label: "hosts auto-deploying from main" },
    { value: "2", label: "apps built by CI on every push and pull request" },
    { value: "REST", label: "decoupled client and API architecture" },
  ],
  trace: {
    mode: "live",
    target: "findspace",
    description:
      "Fires one real read-only request at the deployed Spring Boot API on Render and times each hop.",
  },
  screens: [
    {
      src: "/screens/findspace/01-search-results.png",
      alt: "FindSpace search results for the term downtown, showing three matching listings with prices and Arlington addresses",
      caption:
        "Search runs as a SQL LIKE across title, address, and description. It is the first thing that breaks at real listing volume.",
      width: 1600,
      height: 1067,
    },
    {
      src: "/screens/findspace/02-listing-detail.png",
      alt: "A FindSpace listing detail page with rent, address, availability, and a message box addressed to the landlord",
      caption:
        "Listing detail. The contact box opens a conversation bound to this listing, which is what makes deletion a runtime decision.",
      width: 1600,
      height: 1111,
    },
    {
      src: "/screens/findspace/03-conversation.png",
      alt: "A threaded FindSpace conversation between a tenant and a landlord about a listing, headed Re: Listing #11",
      caption:
        "A thread carrying its listing reference. History like this is why a listing with conversations is hidden rather than removed.",
      width: 1600,
      height: 1000,
    },
    {
      src: "/screens/findspace/04-landlord-dashboard.png",
      alt: "The FindSpace landlord dashboard listing three properties, one marked inactive and hidden from public view",
      caption:
        "The soft delete rule in the open: two listings offer Delete, the one with history offers Remove and reads hidden from public view, edit it to reactivate.",
      width: 1600,
      height: 1167,
    },
  ],
  readerSummary:
    "A room rental marketplace: tenants search listings and message landlords, landlords manage their own inventory. Next.js client on Vercel, Spring Boot 3.2 API in Docker on Render, PostgreSQL 15 on Neon. Stateless JWT auth, a runtime soft-delete policy, environment-driven configuration, and CI building both apps on every push. The free tier sleeps, so the first request after idle is slow.",
};
