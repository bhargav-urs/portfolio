import type { Subsystem } from "../types";

export const convergeai: Subsystem = {
  slug: "convergeai",
  name: "ConvergeAI",
  oneLine:
    "A document-grounded platform where three independent language models answer, critique each other against the source text, revise, and converge on one cited answer.",
  statusMode: "static",
  staticStatusNote: "not publicly deployed",
  repo: {
    label: "Repository",
    href: "https://github.com/bhargav-urs/ConvergeAI",
    host: "github.com",
  },
  canvas: { w: 980, h: 700 },
  boundaries: [
    {
      id: "svc",
      label: "Spring Boot 3.5 service",
      note: "Java 21",
      x: 300,
      y: 40,
      w: 400,
      h: 520,
    },
  ],
  sequence: {
    title: "The five phases",
    steps: ["Retrieval", "Independent answers", "Cross-critique", "Revision", "Consensus"],
  },
  nodes: [
    {
      id: "client",
      label: "React 18 + Vite client",
      kind: "client",
      x: 40,
      y: 260,
      w: 200,
      h: 72,
      detail: {
        role: "Uploads documents, streams the debate phase by phase as it happens, and renders the final cited answer.",
        why: "The debate is a stream, not a page load. A socket-first client with a small store renders each phase event as it arrives, and Vite keeps the iteration loop short.",
        rejected:
          "Next.js. Server rendering buys nothing when every interesting byte arrives over a WebSocket after load.",
        breaks:
          "Reconnect quality depends entirely on the server's hydration payload. If the event log ever truncates, a client that rejoins late renders a hole it cannot detect.",
      },
    },
    {
      id: "tika",
      label: "Apache Tika parse",
      sub: "ingestion",
      kind: "service",
      x: 330,
      y: 84,
      w: 160,
      h: 60,
      detail: {
        role: "Parses PDF, Word, HTML, and plain text uploads into one normalised text stream before chunking.",
        why: "One parser that reads almost any format beats a per-format zoo. Ingestion is a background concern and Tika's cost profile is acceptable there.",
        rejected:
          "A PDF-only parser. Lighter, but the first non-PDF upload becomes a feature request instead of a no-op.",
        breaks:
          "Tika is memory-hungry on pathological files; a huge scanned PDF can stall ingestion. A size cap and an upload queue are the guardrails.",
      },
    },
    {
      id: "splitter",
      label: "Recursive overlapping splitter",
      kind: "service",
      x: 330,
      y: 186,
      w: 160,
      h: 64,
      detail: {
        role: "Cuts parsed text into overlapping chunks sized for the embedder, preserving continuity across chunk boundaries.",
        why: "Recursive splitting respects paragraph and sentence structure before falling back to hard cuts, and the overlap keeps a fact that straddles a boundary retrievable from either side.",
        rejected:
          "Fixed-size windows with no overlap. Simpler arithmetic, but facts near chunk edges lose their context and retrieval quality drops exactly where it matters.",
        breaks:
          "Chunk size is tuned to the embedder's context. Swapping the embedding model means retuning by hand; there is no automated sweep for it.",
      },
    },
    {
      id: "onnx",
      label: "ONNX MiniLM embedder",
      sub: "all-MiniLM-L6-v2, 384-d",
      kind: "service",
      x: 320,
      y: 292,
      w: 180,
      h: 84,
      detail: {
        role: "Turns every chunk and every query into a 384-dimension vector, in-process, on the CPU.",
        why: "A quantised local model means indexing costs nothing and document text never leaves the process. The 384-dimension output is the schema contract for the vector(384) column.",
        rejected:
          "A hosted embedding API. Better vectors per dollar at scale, but it meters every index rebuild and ships user documents to a third party.",
        breaks:
          "CPU embedding is fine at document scale and slow at corpus scale. Past that, batching plus a GPU runtime, or accepting the API tradeoff after all.",
      },
    },
    {
      id: "orchestrator",
      label: "Orchestrator state machine",
      sub: "5 phases, virtual threads",
      kind: "service",
      x: 512,
      y: 84,
      w: 165,
      h: 84,
      detail: {
        role: "Drives each debate through five phases: retrieval, independent answers, cross-critique, revision, consensus.",
        why: "An explicit state machine makes each phase observable and resumable, and running the three agents concurrently on Java 21 virtual threads prices a round at the slowest model rather than the sum of all three.",
        rejected:
          "A chain of async callbacks per debate. It works until the first requirement to inspect, replay, or resume a debate mid-flight, which is exactly what an explicit state machine gives.",
        breaks:
          "Phase state lives in the process. A restart mid-debate loses the run; externalising phase state to Postgres is the path to durability.",
      },
    },
    {
      id: "router",
      label: "Provider router",
      sub: "retry + failover",
      kind: "service",
      x: 512,
      y: 210,
      w: 165,
      h: 64,
      detail: {
        role: "Sends each model call to its provider, honours Retry-After on rate limits, fails over across providers, and parses every response defensively.",
        why: "Free-tier model endpoints return malformed output and rate limits as a matter of routine rather than as an exception, so the router treats every response as suspect until proven parsed.",
        rejected:
          "A single provider with a paid rate limit. Simpler, but one provider outage stalls every debate; failover turns an outage into a slower round.",
        breaks:
          "Failover assumes providers are interchangeable, but models differ in style and quality, so a heavy-failover day shifts the answer profile. Per-provider quality tracking would make that visible.",
      },
    },
    {
      id: "consensus",
      label: "Consensus engine",
      kind: "service",
      x: 512,
      y: 430,
      w: 165,
      h: 60,
      detail: {
        role: "Merges the three revised answers into one, keeps the citations that survived cross-critique, and records model-reported confidence.",
        why: "A separate engine keeps the merge rules testable in isolation from transport and prompting concerns.",
        rejected:
          "Letting a fourth model call do the merging. It adds a provider round trip and hides the merge logic inside an opaque call.",
        breaks:
          "Confidence is model-reported and not calibrated against ground truth. Without an evaluation harness the merge stays a design argument, not a measured result.",
      },
    },
    {
      id: "groq",
      label: "Groq",
      sub: "Llama 3.3 70B",
      kind: "external",
      x: 760,
      y: 84,
      w: 180,
      h: 56,
      detail: {
        role: "Serves Llama 3.3 70B as the first of the three independent debaters.",
        why: "Fast inference on a capable open-weight model at free-tier cost, which sets the pace a debate round can run at.",
        rejected:
          "Self-hosting a 70B model. Full control, but the hardware bill is real and this project's point is orchestration, not model serving.",
        breaks:
          "Free-tier rate limits dominate the latency profile; a burst of debates queues behind Retry-After.",
      },
    },
    {
      id: "cerebras",
      label: "Cerebras",
      sub: "GLM-4.7",
      kind: "external",
      x: 760,
      y: 168,
      w: 180,
      h: 56,
      detail: {
        role: "Serves GLM-4.7 as the second independent debater.",
        why: "A different model family from a different provider keeps the debate genuinely independent. Three copies of one model mostly agree with themselves.",
        rejected:
          "Three prompts against one model at different temperatures. Cheaper, but critique between near-clones is theatre.",
        breaks:
          "Provider-specific output quirks surface here first; the router's defensive parser exists because of them.",
      },
    },
    {
      id: "gemini",
      label: "Gemini 2.5 Flash",
      kind: "external",
      x: 760,
      y: 252,
      w: 180,
      h: 56,
      detail: {
        role: "Serves Gemini 2.5 Flash as the third independent debater.",
        why: "A third model family completes the spread: three architectures, three training sets, three different failure modes to critique each other.",
        rejected:
          "A larger Gemini variant. Better answers, slower rounds; Flash keeps a debate round inside the latency budget.",
        breaks:
          "Quota resets and model retirements arrive on the provider's schedule, not this project's. The fallback pool absorbs that, at a quality cost.",
      },
    },
    {
      id: "openrouter",
      label: "OpenRouter",
      sub: "fallback pool",
      kind: "external",
      x: 760,
      y: 336,
      w: 180,
      h: 56,
      detail: {
        role: "The fallback pool: when a primary provider rate-limits or fails, the call reroutes here.",
        why: "One integration that fronts many models is exactly the shape a fallback needs. Breadth matters more than speed on the failure path.",
        rejected:
          "Retrying the failed provider harder. Backoff against a hard rate limit converts an error into a stall.",
        breaks:
          "Fallback models differ from the primaries, so a heavily degraded day changes the debate's character, and that shift is currently invisible in the output.",
      },
    },
    {
      id: "db",
      label: "PostgreSQL + pgvector",
      sub: "HNSW cosine, Flyway",
      kind: "datastore",
      x: 330,
      y: 600,
      w: 220,
      h: 80,
      detail: {
        role: "One database holds chunks, vectors, debates, and phase events; pgvector's HNSW index serves cosine retrieval.",
        why: "Vectors and relational rows in one PostgreSQL database with Flyway migrations means one backup, one transaction boundary, one connection pool.",
        rejected:
          "A dedicated vector store beside Postgres. Faster at massive scale, but it doubles the operational surface and splits a debate's writes across two systems with no shared transaction.",
        breaks:
          "HNSW insert cost grows with the index, so heavy re-indexing wants an offline build. At true scale the single database becomes the bottleneck the dedicated store would have dodged.",
      },
    },
  ],
  edges: [
    { from: "client", to: "tika", fromSide: "right", toSide: "left", label: "REST", bend: 276, toAt: 0.5 },
    {
      from: "client",
      to: "orchestrator",
      fromSide: "top",
      toSide: "top",
      bend: 28,
      label: "STOMP over SockJS",
    },
    { from: "tika", to: "splitter", fromSide: "bottom", toSide: "top" },
    { from: "splitter", to: "onnx", fromSide: "bottom", toSide: "top" },
    { from: "onnx", to: "db", fromSide: "bottom", toSide: "top", label: "vector(384)" },
    { from: "orchestrator", to: "router", fromSide: "bottom", toSide: "top" },
    { from: "orchestrator", to: "consensus", fromSide: "left", toSide: "left", bend: 506 },
    { from: "consensus", to: "db", fromSide: "bottom", toSide: "right", bend: 640, label: "JDBC" },
    { from: "router", to: "groq", fromSide: "right", toSide: "left", fromAt: 0.2, bend: 700, dashed: true },
    { from: "router", to: "cerebras", fromSide: "right", toSide: "left", fromAt: 0.4, bend: 714, dashed: true },
    { from: "router", to: "gemini", fromSide: "right", toSide: "left", fromAt: 0.6, bend: 728, dashed: true },
    { from: "router", to: "openrouter", fromSide: "right", toSide: "left", fromAt: 0.8, bend: 742, dashed: true },
  ],
  decisions: [
    {
      title: "Embeddings stay in-process",
      decision:
        "Embeddings run in-process on a quantised ONNX build of all-MiniLM-L6-v2 rather than through an embedding API.",
      constraint: "Indexing has to cost nothing, and document text must not leave the process.",
      rejected: "A hosted embedding API, which meters every index rebuild and ships user documents out.",
      consequence:
        "The 384-dimension output is the schema contract for the vector(384) column, and embedding quality is capped at what a small local model gives.",
    },
    {
      title: "Concurrency on virtual threads",
      decision:
        "The three agents run concurrently on Java 21 virtual threads, so a debate round costs the slowest model rather than the sum of all three.",
      constraint: "Sequential rounds put end-to-end latency at roughly 4.5 minutes, which is unusable.",
      rejected:
        "A reactive rewrite on WebFlux. Same concurrency, at the price of infecting every signature with reactive types.",
      consequence:
        "End-to-end latency fell to under a minute, and to about 5 seconds in fast mode, while the code stays in plain blocking style.",
    },
    {
      title: "Assume providers misbehave",
      decision:
        "Multi-provider routing with retry that honours Retry-After, cross-provider failover, and defensive JSON parsing.",
      constraint:
        "Free-tier model endpoints return malformed output and rate limits as a matter of routine rather than as an exception.",
      rejected: "Treating provider errors as exceptional and surfacing them straight to the user.",
      consequence:
        "Every response passes through a parser that assumes it is broken, which costs code and a little latency on the happy path.",
    },
    {
      title: "One database, not two",
      decision:
        "Vectors and relational rows live in one PostgreSQL database with Flyway migrations, rather than a separate vector store.",
      constraint: "A debate writes chunks, vectors, and events together, and they need to stay consistent.",
      rejected: "A dedicated vector database running beside Postgres.",
      consequence:
        "One backup, one transaction boundary, one connection pool. The ceiling is Postgres's vector performance, accepted knowingly.",
    },
    {
      title: "Late subscribers see the whole story",
      decision:
        "WebSocket subscribers receive a hydration payload on subscribe, so a client that connects mid-pipeline sees the events it missed instead of an empty panel.",
      constraint: "Debates outlive page loads. Refreshing during phase three must not blank the screen.",
      rejected: "Making clients poll a REST endpoint for history alongside the socket.",
      consequence:
        "The server keeps an ordered event log per debate and pays a replay cost on every subscribe.",
    },
  ],
  limitations: [
    "Free-tier providers dominate the latency profile and the quality ceiling.",
    "There is no evaluation harness, so \"the debate improves the answer\" is a design argument rather than a measured result.",
    "Confidence scores are model-reported and not calibrated against ground truth.",
  ],
  stack: [
    { tech: "java", label: "Java 21", group: "backend", nodes: ["orchestrator", "router", "consensus"] },
    { tech: "spring-boot", label: "Spring Boot 3.5", group: "backend", nodes: ["orchestrator", "router", "consensus"] },
    { tech: "spring-web", label: "Spring Web", group: "backend", nodes: ["tika"] },
    { tech: "spring-websocket", label: "Spring WebSocket (STOMP)", group: "backend", nodes: ["orchestrator"] },
    { tech: "spring-data-jpa", label: "Spring Data JPA", group: "backend", nodes: ["db"] },
    { tech: "bean-validation", label: "Bean Validation", group: "backend", nodes: ["tika"] },
    { tech: "actuator", label: "Spring Actuator", group: "backend", nodes: ["orchestrator"] },
    { tech: "hibernate", label: "Hibernate + hibernate-vector", group: "backend", nodes: ["db"] },
    { tech: "flyway", label: "Flyway", group: "data", nodes: ["db"] },
    { tech: "langchain4j", label: "LangChain4j", group: "backend", nodes: ["router"] },
    { tech: "tika", label: "Apache Tika", group: "backend", nodes: ["tika"] },
    { tech: "onnx-runtime", label: "ONNX Runtime", group: "backend", nodes: ["onnx"] },
    { tech: "postgresql", label: "PostgreSQL", group: "data", nodes: ["db"] },
    { tech: "pgvector", label: "pgvector + HNSW", group: "data", nodes: ["db"] },
    { tech: "react", label: "React 18", group: "frontend", nodes: ["client"] },
    { tech: "typescript", label: "TypeScript strict", group: "frontend", nodes: ["client"] },
    { tech: "vite", label: "Vite", group: "frontend", nodes: ["client"] },
    { tech: "tailwind", label: "Tailwind CSS", group: "frontend", nodes: ["client"] },
    { tech: "radix", label: "Radix UI", group: "frontend", nodes: ["client"] },
    { tech: "zustand", label: "Zustand", group: "frontend", nodes: ["client"] },
    { tech: "tanstack-query", label: "TanStack Query", group: "frontend", nodes: ["client"] },
    { tech: "stompjs", label: "STOMP.js", group: "frontend", nodes: ["client"] },
    { tech: "sockjs", label: "SockJS", group: "frontend", nodes: ["client"] },
    { tech: "react-markdown", label: "react-markdown", group: "frontend", nodes: ["client"] },
    { tech: "recharts", label: "Recharts", group: "frontend", nodes: ["client"] },
    { tech: "react-dropzone", label: "react-dropzone", group: "frontend", nodes: ["client"] },
    { tech: "sonner", label: "Sonner", group: "frontend", nodes: ["client"] },
    { tech: "docker", label: "Docker", group: "infra", nodes: ["client", "orchestrator"] },
    { tech: "docker-compose", label: "Docker Compose", group: "infra", nodes: ["client", "orchestrator"] },
    { tech: "nginx", label: "Nginx", group: "infra", nodes: ["client"] },
    { tech: "github-actions", label: "GitHub Actions", group: "infra", nodes: ["client", "orchestrator"] },
    { tech: "junit", label: "JUnit 5", group: "testing", nodes: ["orchestrator", "consensus"] },
    { tech: "maven", label: "Maven", group: "infra", nodes: ["orchestrator"] },
  ],
  metrics: [
    { value: "5", label: "orchestration phases in the pipeline" },
    { value: "384", label: "dimensions in the local embedding output" },
    { value: "4", label: "model providers with automatic failover" },
    { value: "<60 s", label: "end-to-end latency, down from roughly 4.5 minutes" },
    { value: "~5 s", label: "end-to-end latency in fast mode" },
  ],
  trace: {
    mode: "recorded",
    description:
      "This service is not publicly deployed. Timings shown here are captured from a real local run, never invented.",
  },
  screens: [],
  readerSummary:
    "Three independent language models answer from the same document, critique each other against the source text, revise, and converge on one cited answer. Spring Boot 3.5 on Java 21 virtual threads, in-process ONNX embeddings, pgvector retrieval, four providers with automatic failover, live progress over STOMP. End-to-end latency fell from roughly 4.5 minutes to under a minute, about 5 seconds in fast mode.",
};
