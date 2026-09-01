import type { Subsystem } from "../types";

export const mappedin: Subsystem = {
  slug: "mappedin",
  name: "MappedIn",
  oneLine:
    "A travel portfolio on a rotatable 3D globe where the geography is computed in PostGIS rather than faked in JavaScript.",
  statusMode: "static",
  staticStatusNote: "not yet deployed",
  repo: {
    label: "Repository",
    href: "https://github.com/bhargav-urs/mappedin",
    host: "github.com",
  },
  extraLinks: [
    {
      label: "Build log",
      href: "https://github.com/bhargav-urs/mappedin/blob/main/docs/BUILD-LOG.md",
      host: "github.com",
      note: "The repository carries a full engineering build log recording every problem hit during the build and how each one was solved.",
    },
  ],
  canvas: { w: 980, h: 700 },
  boundaries: [
    { id: "api", label: "Spring Boot 4.1", note: "Java 25", x: 300, y: 60, w: 280, h: 420 },
    { id: "dbb", label: "PostgreSQL 18 + PostGIS 3.6", x: 640, y: 60, w: 300, h: 420 },
    { id: "test", label: "Test boundary", x: 300, y: 540, w: 280, h: 130 },
  ],
  nodes: [
    {
      id: "client",
      label: "Next.js 16 + MapLibre GL",
      sub: "globe client",
      kind: "client",
      x: 40,
      y: 200,
      w: 200,
      h: 84,
      detail: {
        role: "Renders the rotatable globe, draws journey arcs from server-computed geometry, and manages auth and place lists.",
        why: "MapLibre GL renders vector tiles on a globe projection without a token or a usage meter, and Next.js 16 provides the app shell with server components where they help.",
        rejected:
          "Computing arcs and distances in the browser with a geometry library. The database already knows the true geodesic; the client should draw what PostGIS computed, not approximate it a second time.",
        breaks:
          "The token sits in localStorage, so the client's script-injection surface is the auth boundary. A Content-Security-Policy is the missing compensating control, stated plainly under known limitations.",
      },
    },
    {
      id: "chain",
      label: "Security filter chain",
      sub: "hand-written",
      kind: "service",
      x: 330,
      y: 104,
      w: 220,
      h: 60,
      detail: {
        role: "Orders every security concern explicitly: CORS, exception translation, the JWT filter, and per-route authorisation rules.",
        why: "Writing the chain by hand makes the ordering visible and reviewable instead of inherited from defaults that shift between Spring Security versions.",
        rejected:
          "The auto-configured chain. It works until an upgrade reorders something silently; a hand-written chain is a test target.",
        breaks:
          "Every new controller needs a deliberate authorisation rule. Forgetting one fails closed, which is safe but surfaces as mysterious 401s during development.",
      },
    },
    {
      id: "jwt",
      label: "JWT filter",
      sub: "HS256, Nimbus JOSE",
      kind: "service",
      x: 330,
      y: 204,
      w: 220,
      h: 60,
      detail: {
        role: "Validates HS256 tokens via Nimbus JOSE and installs the authenticated principal for the request.",
        why: "Stateless HS256 with a single signing key fits a single-service deployment: no session store, no sticky instance.",
        rejected:
          "RS256 with a key pair. Correct the moment a second service must verify tokens; pure overhead while there is exactly one verifier.",
        breaks:
          "There is no revocation path, and rotating the signing key logs everyone out at once. A key id claim plus a two-key overlap window is the next step.",
      },
    },
    {
      id: "repos",
      label: "Ownership-scoped repositories",
      kind: "service",
      x: 330,
      y: 304,
      w: 220,
      h: 64,
      detail: {
        role: "Every query is scoped by owner at the repository signature: no method can fetch a list without being told whose it is.",
        why: "Authorization is structural, not procedural. \"Forgot the permission check\" stops being a possible mistake because the signature will not compile without the owner. Another user's resource returns 404 rather than 403, so identifiers cannot be enumerated by diffing status codes.",
        rejected:
          "Service-layer permission checks ahead of generic repository calls. That is procedure, and procedure gets skipped exactly once.",
        breaks:
          "Sharing features, like a list visible to two users, break the one-owner signature shape. The model would need a membership join, and the structural guarantee becomes subtler to state.",
      },
    },
    {
      id: "flyway",
      label: "Flyway",
      sub: "7 migrations",
      kind: "service",
      x: 330,
      y: 400,
      w: 220,
      h: 52,
      detail: {
        role: "Applies the seven migrations at boot, so schema state is a property of the code rather than of whoever touched the database last.",
        why: "Migrations that create GIST indexes, trigger functions, and uuidv7() defaults are exactly the SQL that must be versioned and reviewed, not run by hand.",
        rejected:
          "Hibernate ddl-auto. It cannot express a GIST index or a trigger, and it diffs the schema instead of recording decisions.",
        breaks:
          "Migrations are append-only, so a bad one ships forever and needs a corrective follow-up. The control is review discipline, not tooling.",
      },
    },
    {
      id: "db",
      label: "PostgreSQL 18",
      sub: "PostGIS 3.6, uuidv7()",
      kind: "datastore",
      x: 670,
      y: 104,
      w: 240,
      h: 70,
      detail: {
        role: "Stores users, places, lists, and memberships; generates UUIDv7 keys natively; runs all geography in SQL.",
        why: "PostgreSQL 18 generates UUIDv7 natively: time-ordered keys that append at the right edge of the B-tree instead of fragmenting pages the way random UUIDv4 does. PostGIS makes the database the one component that actually understands the sphere.",
        rejected:
          "Bigint keys. Smaller and naturally ordered, but the 404-not-403 defence is far weaker against sequential identifiers.",
        breaks:
          "A single instance with no read replica. The geography workload is read-heavy, so the first scaling move is a replica for reads.",
      },
    },
    {
      id: "dwithin",
      label: "ST_DWithin",
      sub: "GIST index scan",
      kind: "datastore",
      x: 670,
      y: 214,
      w: 240,
      h: 56,
      detail: {
        role: "Answers proximity queries as an index scan over the GIST index.",
        why: "EXPLAIN (ANALYZE, BUFFERS) confirms ST_DWithin produces an index scan, while the equivalent ST_Distance(...) < n degrades to a sequential scan because the planner cannot convert a scalar comparison into a box predicate. Verified, not assumed.",
        rejected: "ST_Distance in the WHERE clause: identical semantics, sequential-scan performance.",
        breaks:
          "ST_DWithin over geography is exact but costs more per candidate row than the geometry variant. At much larger row counts, a box-filter-then-exact two-step becomes the tuning lever.",
      },
    },
    {
      id: "segmentize",
      label: "ST_Segmentize",
      sub: "geography(Point,4326)",
      kind: "datastore",
      x: 670,
      y: 300,
      w: 240,
      h: 56,
      detail: {
        role: "Densifies each journey line along the true geodesic so arcs drape over the sphere instead of cutting through it.",
        why: "ST_Segmentize on a geography column adds vertices along the great circle. The client draws exactly what it is given.",
        rejected:
          "Interpolating arc points in JavaScript. It duplicates the geodesic math in a second language and drifts from what the distance figures report.",
        breaks:
          "Densified lines multiply vertex counts, so very long routes at fine segment lengths inflate payloads. Zoom-dependent segment length is the fix.",
      },
    },
    {
      id: "distance",
      label: "ST_Distance",
      sub: "spheroid metres",
      kind: "datastore",
      x: 670,
      y: 386,
      w: 240,
      h: 56,
      detail: {
        role: "Reports real spheroid metres between places, used for journey totals.",
        why: "The spheroid figure is the honest number. Sphere-approximation error is small but visible over long routes, and there is no reason to accept it.",
        rejected:
          "Haversine in application code: close enough until it is not, and a second implementation to keep consistent with the database's.",
        breaks:
          "Spheroid math is the most expensive of the three calls. If distance matrices over many points ever appear, precomputation or the sphere approximation becomes the tradeoff.",
      },
    },
    {
      id: "nominatim",
      label: "OpenStreetMap Nominatim",
      sub: "geocoding",
      kind: "external",
      x: 40,
      y: 380,
      w: 200,
      h: 64,
      detail: {
        role: "Turns a typed place name into candidate coordinates, ranked by Wikipedia-derived prominence.",
        why: "The geocoder was chosen by measurement. The first candidate ranked \"Eiffel Tower\" as a hill in Alberta and \"Mount Fuji\" as a location in Wisconsin; this one ranks landmarks the way a person expects.",
        rejected: "The first geocoder trialled, which returned confident nonsense for famous landmarks.",
        breaks:
          "The stricter rate limit is absolute, so the search UI is built around debounce and caching. A commercial geocoder is the way out if search volume ever matters.",
      },
    },
    {
      id: "ofm",
      label: "OpenFreeMap",
      sub: "vector tiles",
      kind: "external",
      x: 40,
      y: 500,
      w: 200,
      h: 64,
      detail: {
        role: "Serves the vector tiles MapLibre renders. No key, no meter.",
        why: "Standard vector tiles without an API key or usage tier keep the map free to run and free to demo indefinitely.",
        rejected:
          "A commercial tile provider. Better cartography, but a metered key in a portfolio project is a liability that outlives the demo.",
        breaks:
          "No SLA. If tiles slow down or disappear, the map degrades. The provider hides behind a style URL, so swapping it is one line.",
      },
    },
    {
      id: "testpg",
      label: "Testcontainers",
      sub: "real PostGIS",
      kind: "service",
      x: 330,
      y: 584,
      w: 220,
      h: 60,
      detail: {
        role: "Runs the backend suite against a real PostGIS container, never H2.",
        why: "uuidv7(), geography, GIST, ST_DWithin, and the trigger functions have no H2 equivalent, so tests against H2 would pass while proving nothing.",
        rejected: "H2 in a PostGIS compatibility mode. It compiles, it passes, it lies.",
        breaks:
          "Container startup dominates suite time. Reused containers keep it tolerable; a much bigger suite would want test slicing.",
      },
    },
  ],
  edges: [
    { from: "client", to: "chain", fromSide: "right", toSide: "left", label: "REST + JWT", bend: 276 },
    { from: "chain", to: "jwt", fromSide: "bottom", toSide: "top" },
    { from: "jwt", to: "repos", fromSide: "bottom", toSide: "top" },
    { from: "repos", to: "db", fromSide: "right", toSide: "left", label: "JDBC", bend: 606, toAt: 0.3 },
    { from: "flyway", to: "db", fromSide: "right", toSide: "left", bend: 626, toAt: 0.75, label: "DDL" },
    { from: "db", to: "dwithin", fromSide: "bottom", toSide: "top" },
    { from: "dwithin", to: "segmentize", fromSide: "bottom", toSide: "top" },
    { from: "segmentize", to: "distance", fromSide: "bottom", toSide: "top" },
    { from: "client", to: "nominatim", fromSide: "bottom", toSide: "top", fromAt: 0.5, dashed: true, label: "geocoding" },
    { from: "client", to: "ofm", fromSide: "bottom", toSide: "top", fromAt: 0.85, bend: 470, dashed: true, label: "vector tiles" },
    { from: "testpg", to: "flyway", fromSide: "top", toSide: "bottom", dashed: true, label: "integration tests" },
  ],
  decisions: [
    {
      title: "Geography lives in the database",
      decision:
        "Proximity is ST_DWithin against a GIST index; journey arcs come from ST_Segmentize on a geography column, which densifies each line along the true geodesic; distances are real spheroid metres from ST_Distance.",
      constraint:
        "Routes must drape over the sphere and distances must be true metres, not planar approximations.",
      rejected: "Faking the geography in JavaScript with client-side interpolation.",
      consequence:
        "The database is the geometry engine. Query cost and tuning live in SQL, and the client stays thin.",
    },
    {
      title: "Index behaviour verified, not assumed",
      decision: "EXPLAIN (ANALYZE, BUFFERS) confirms ST_DWithin produces an index scan.",
      constraint:
        "The equivalent ST_Distance(...) < n degrades to a sequential scan because the planner cannot convert a scalar comparison into a box predicate.",
      rejected: "Trusting that any spatial predicate would use the spatial index.",
      consequence:
        "Query shapes are pinned by evidence. A regression shows up as a plan change, not as a slow page.",
    },
    {
      title: "Authorization is structural, not procedural",
      decision:
        "No repository method can fetch a list without being told whose it is, so \"forgot the permission check\" is not a mistake the code permits.",
      constraint: "Ownership rules must hold across every current and future endpoint.",
      rejected: "Procedural permission checks sprinkled ahead of generic repository calls.",
      consequence:
        "Another user's resource returns 404 rather than 403, so record identifiers cannot be enumerated by diffing status codes.",
    },
    {
      title: "UUIDv7 primary keys, generated in the database",
      decision: "Primary keys are UUIDv7, generated natively by PostgreSQL 18.",
      constraint:
        "Random UUIDv4 fragments B-tree pages on insert; sequential identifiers invite enumeration.",
      rejected:
        "A bigint would be smaller and naturally ordered, but the 404-not-403 defence is far weaker against sequential identifiers.",
      consequence:
        "Time-ordered inserts append at the right edge of the B-tree, and keys stay opaque to users.",
    },
    {
      title: "List membership is an entity",
      decision: "List membership is a first-class association entity carrying visited_on and notes.",
      constraint: "The relationship itself holds data: when a place was visited, and what was noted there.",
      rejected:
        "A JPA @ManyToMany, which has nowhere to put relationship attributes and rewrites every join row on modification.",
      consequence: "One more entity and repository to maintain, in exchange for stable rows and a home for the data.",
    },
    {
      title: "Tests run against real PostGIS",
      decision: "The backend suite runs against real PostGIS through Testcontainers, never H2.",
      constraint:
        "uuidv7(), geography, GIST, ST_DWithin, and the trigger functions have no H2 equivalent, so H2 tests would pass while proving nothing.",
      rejected: "H2 in a compatibility mode.",
      consequence: "Docker becomes a test dependency, and container start time is paid on every run.",
    },
    {
      title: "The geocoder was chosen by measurement",
      decision: "Geocoding ranks candidates by Wikipedia-derived prominence.",
      constraint:
        "The first candidate ranked \"Eiffel Tower\" as a hill in Alberta and \"Mount Fuji\" as a location in Wisconsin.",
      rejected: "Keeping the first geocoder for its friendlier rate limit.",
      consequence: "A stricter rate limit that the search UI was then designed around.",
    },
    {
      title: "The antimeridian is handled, and pinned by tests",
      decision: "Longitude unwrapping keeps journey arcs continuous across the antimeridian.",
      constraint: "A naive renderer draws a Pacific crossing as a line around the whole planet.",
      rejected: "Clamping longitudes to [-180, 180] and accepting the wrap.",
      consequence:
        "Tests assert both that no step exceeds 180 degrees and that vertices are allowed to fall outside the [-180, 180] range.",
    },
  ],
  limitations: [
    "The server-side bounding box is antimeridian-naive, and a test asserts that wrong behaviour on purpose, so fixing it flips a test rather than going unnoticed.",
    "There is no Content-Security-Policy, which is the main missing compensating control given that the token is held in localStorage.",
    "There is no token revocation path.",
  ],
  stack: [
    { tech: "java", label: "Java 25", group: "backend", nodes: ["chain", "jwt", "repos"] },
    { tech: "spring-boot", label: "Spring Boot 4.1.0", group: "backend", nodes: ["chain", "jwt", "repos"] },
    { tech: "spring-framework", label: "Spring Framework 7.0.8", group: "backend", nodes: ["chain", "jwt", "repos"] },
    { tech: "spring-security", label: "Spring Security 7.1.0", group: "backend", nodes: ["chain", "jwt"] },
    { tech: "jackson", label: "Jackson 3.1.4", group: "backend", nodes: ["chain"] },
    { tech: "hibernate", label: "Hibernate ORM + Spatial 7.4.1", group: "backend", nodes: ["repos"] },
    { tech: "flyway", label: "Flyway 12.4.0", group: "data", nodes: ["flyway"] },
    { tech: "pg-jdbc", label: "PostgreSQL JDBC 42.7.11", group: "backend", nodes: ["repos"] },
    { tech: "springdoc", label: "springdoc-openapi 3.1.0", group: "backend", nodes: ["chain"] },
    { tech: "postgresql", label: "PostgreSQL 18", group: "data", nodes: ["db"] },
    { tech: "postgis", label: "PostGIS 3.6", group: "data", nodes: ["db", "dwithin", "segmentize", "distance"] },
    { tech: "jts", label: "JTS", group: "backend", nodes: ["repos"] },
    { tech: "node", label: "Node 24", group: "frontend", nodes: ["client"] },
    { tech: "nextjs", label: "Next.js 16.3.0", group: "frontend", nodes: ["client"] },
    { tech: "react", label: "React 19.2.8", group: "frontend", nodes: ["client"] },
    { tech: "typescript", label: "TypeScript 6.0.3", group: "frontend", nodes: ["client"] },
    { tech: "tailwind", label: "Tailwind 4.3.3", group: "frontend", nodes: ["client"] },
    { tech: "zustand", label: "Zustand 5.0.15", group: "frontend", nodes: ["client"] },
    { tech: "maplibre", label: "MapLibre GL JS 6.3.0", group: "frontend", nodes: ["client"] },
    { tech: "react-map-gl", label: "react-map-gl 8.1.2", group: "frontend", nodes: ["client"] },
    { tech: "junit", label: "JUnit Jupiter 6.0.3", group: "testing", nodes: ["testpg"] },
    { tech: "testcontainers", label: "Testcontainers 2.0.5", group: "testing", nodes: ["testpg"] },
    { tech: "mockito", label: "Mockito", group: "testing", nodes: ["testpg"] },
    { tech: "jacoco", label: "JaCoCo 0.8.15", group: "testing", nodes: ["testpg"] },
    { tech: "vitest", label: "Vitest 4.1.10", group: "testing", nodes: ["client"] },
    { tech: "docker", label: "Docker", group: "infra", nodes: ["testpg"] },
    { tech: "docker-compose", label: "Docker Compose", group: "infra", nodes: ["db"] },
    { tech: "github-actions", label: "GitHub Actions", group: "infra", nodes: ["testpg"] },
    { tech: "nominatim", label: "Nominatim", group: "infra", nodes: ["nominatim"] },
    { tech: "openfreemap", label: "OpenFreeMap", group: "infra", nodes: ["ofm"] },
    { tech: "rfc9457", label: "RFC 9457 problem details", group: "standards", nodes: ["chain"] },
    { tech: "rfc7946", label: "RFC 7946 GeoJSON", group: "standards", nodes: ["client", "segmentize"] },
    { tech: "rfc9562", label: "RFC 9562 UUIDv7", group: "standards", nodes: ["db"] },
    { tech: "openapi", label: "OpenAPI 3", group: "standards", nodes: ["chain"] },
    { tech: "epsg4326", label: "EPSG:4326", group: "standards", nodes: ["db"] },
    { tech: "nimbus-jose", label: "JWT HS256 via Nimbus JOSE", group: "standards", nodes: ["jwt"] },
  ],
  metrics: [
    { value: "83", label: "tests: 41 backend unit, 29 backend integration, 13 frontend" },
    { value: "89.7%", label: "instruction coverage" },
    { value: "85.0%", label: "line coverage" },
    { value: "100%", label: "of classes covered" },
    { value: "60", label: "Java files" },
    { value: "33", label: "TypeScript files" },
    { value: "16", label: "REST endpoints across 3 controllers" },
    { value: "7", label: "Flyway migrations" },
    { value: "4", label: "tables" },
    { value: "9", label: "indexes" },
    { value: "8", label: "architecture decision records" },
    { value: "72", label: "seeded places" },
    { value: "3", label: "green CI jobs" },
  ],
  trace: {
    mode: "recorded",
    description:
      "Not yet deployed. Timings shown here are captured from a real local run, never invented.",
  },
  screens: [],
  readerSummary:
    "A travel portfolio on a rotatable 3D globe where the geography is computed in PostGIS, not faked in JavaScript. Spring Boot 4.1 on Java 25, PostgreSQL 18 with native UUIDv7 keys, ownership-scoped repositories returning 404 over 403, geodesic arcs from ST_Segmentize, and tests against real PostGIS through Testcontainers. 83 tests, 89.7% instruction coverage, antimeridian handling pinned by tests.",
};
