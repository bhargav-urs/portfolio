import type { Subsystem } from "../types";

export const agripulse: Subsystem = {
  slug: "agripulse",
  name: "AgriPulse HMI",
  oneLine:
    "A real-time mobile control panel for a smart irrigation pump, built to behave like an industrial controller rather than a dashboard.",
  statusMode: "static",
  staticStatusNote: "not publicly deployed",
  repo: {
    label: "Repository",
    href: "https://github.com/bhargav-urs/Agripulse-HMI",
    host: "github.com",
  },
  canvas: { w: 980, h: 640 },
  boundaries: [
    { id: "backend", label: "Node 22 + Express backend", x: 410, y: 60, w: 330, h: 460 },
  ],
  nodes: [
    {
      id: "app",
      label: "React Native 0.86",
      sub: "operator app",
      kind: "client",
      x: 30,
      y: 90,
      w: 190,
      h: 76,
      detail: {
        role: "The operator's control panel: live telemetry, pump control, alert acknowledgement, and an SVG gauge drawn for the industrial look.",
        why: "React Native gives one codebase for a phone-first control panel, and the socket client renders device state the moment it changes rather than on a refresh interval.",
        rejected:
          "A responsive web dashboard. Fine at a desk, wrong in a field; the app owns the network diagnostics and local storage that a spotty connection needs.",
        breaks:
          "There is no authentication on the operator app; anyone who can reach the backend can drive it. That is a named limitation, not a surprise.",
      },
    },
    {
      id: "native",
      label: "Android native module",
      sub: "NetworkDiagnosticsModule, Java",
      kind: "client",
      x: 30,
      y: 240,
      w: 190,
      h: 76,
      detail: {
        role: "OS-level network diagnostics: connection type, reachability, and latency to the backend, measured with raw sockets.",
        why: "JavaScript cannot see connection type or run honest reachability checks. ConnectivityManager and a raw TCP probe can, and the blocking checks run on a background thread so the UI never freezes.",
        rejected:
          "A community networking library. It reports what the OS volunteers, which is not the same as measuring the path to this specific backend.",
        breaks:
          "The module is Android-only. iOS needs its own implementation behind the same bridge interface before the app is genuinely cross-platform.",
      },
    },
    {
      id: "interlocks",
      label: "Safety interlocks",
      sub: "server-authoritative",
      kind: "service",
      x: 430,
      y: 110,
      w: 140,
      h: 84,
      detail: {
        role: "The gate in front of every pump command: tank level, device online, emergency stop latch, already-running state, and a maximum-runtime auto-stop.",
        why: "Safety and control are server-authoritative because the client is never trusted for a critical decision. The pump will not start when the tank is low, the device is offline, a stop is latched, or it is already running.",
        rejected:
          "Client-side guards with a thin server. A stale app or a crafted request would happily start a dry pump.",
        breaks:
          "Interlocks read the in-memory cache, so if invalidation ever lagged real device state the gate would act on stale data. The heartbeat and offline-detection windows bound that risk.",
      },
    },
    {
      id: "automation",
      label: "Weather automation",
      sub: "pure rule function",
      kind: "service",
      x: 585,
      y: 110,
      w: 140,
      h: 84,
      detail: {
        role: "Decides irrigation from weather and telemetry as a pure rule function, and stores every decision with its inputs and its reasoning.",
        why: "A pure function is unit-testable without a device, and storing inputs beside each decision means \"why did it skip irrigation at 6am\" has an answer in the database.",
        rejected: "A cron script with inline conditionals. It works, it is untestable, and its decisions evaporate.",
        breaks:
          "Rules are fixed at deploy time. Per-field tuning needs a rules table, and the audit trail matters even more once operators can change the rules.",
      },
    },
    {
      id: "cache",
      label: "In-memory device state cache",
      kind: "service",
      x: 450,
      y: 260,
      w: 220,
      h: 64,
      detail: {
        role: "Holds current device state in memory to serve the hot paths: safety checks and automation decisions.",
        why: "Safety checks cannot wait on a database round trip, and a high-frequency telemetry stream would hammer Postgres if every reading hit disk.",
        rejected:
          "Reading Postgres on every check. Simpler, and it puts the database inside the safety path where it does not belong.",
        breaks:
          "One process, one cache. A second backend instance would split brain; externalising to Redis is the standard next step past one node.",
      },
    },
    {
      id: "writes",
      label: "Throttled writes",
      kind: "service",
      x: 450,
      y: 380,
      w: 220,
      h: 56,
      detail: {
        role: "Flushes the telemetry stream to PostgreSQL at a bounded rate as the durable record.",
        why: "Throttling bounds database growth on a high-frequency stream while keeping a durable history for charts and decision audits.",
        rejected:
          "Writing every reading. Honest, and it fills a free-tier database with rows nobody will query at that resolution.",
        breaks:
          "A crash between flushes loses the buffered readings. Acceptable for telemetry; decisions and alerts write through immediately instead.",
      },
    },
    {
      id: "db",
      label: "PostgreSQL 16",
      sub: "via Prisma, 7 tables",
      kind: "datastore",
      x: 770,
      y: 418,
      w: 180,
      h: 76,
      detail: {
        role: "The durable record: telemetry history, decisions with reasoning, alerts, and device configuration, with native enums and indexed time series.",
        why: "Prisma's typed client keeps the Node codebase honest about the schema, and indexed time-series tables serve the charts without scanning history.",
        rejected:
          "A time-series database beside Postgres. Purpose-built, but a second store for one device's telemetry is operational cost without a workload behind it.",
        breaks:
          "Time-series tables grow without bound. At fleet scale this wants partitioning or retention policies before queries slow down.",
      },
    },
    {
      id: "sim",
      label: "Virtual IoT device simulator",
      sub: "swaps for ESP32 / Pi",
      kind: "service",
      x: 30,
      y: 460,
      w: 190,
      h: 84,
      detail: {
        role: "A deterministic, physically grounded stand-in for the pump controller, speaking the exact protocol real hardware would.",
        why: "A fixed daily temperature curve, humidity from the Magnus equation, temperature-scaled evaporation, and a stochastic rain model produce telemetry that behaves like weather instead of random noise, and determinism makes bugs reproducible.",
        rejected:
          "Replaying a canned telemetry log. Easy, but it cannot react to commands, so the control loop would be untestable end to end.",
        breaks:
          "It is a simulator, and it stays one until an ESP32 or Raspberry Pi connects over the same namespace. Nothing in the backend or the app changes when that happens; that swap is the point of the design.",
      },
    },
    {
      id: "meteo",
      label: "Open-Meteo",
      kind: "external",
      x: 770,
      y: 214,
      w: 180,
      h: 64,
      detail: {
        role: "Supplies the forecast the automation engine folds into its irrigation decisions.",
        why: "Open-Meteo needs no API key, which keeps the automation runnable by anyone who clones the repository.",
        rejected: "A commercial weather API with better resolution, at the cost of a metered key in a project meant to run free.",
        breaks:
          "No key also means no SLA. The engine treats missing forecast data as a reason to be conservative rather than a reason to crash.",
      },
    },
  ],
  edges: [
    { from: "native", to: "app", fromSide: "top", toSide: "bottom", label: "bridge" },
    {
      from: "app",
      to: "interlocks",
      fromSide: "right",
      toSide: "left",
      toAt: 0.33,
      bend: 315,
      label: "Socket.IO, operator namespace",
      labelPos: { x: 315, y: 112 },
    },
    {
      from: "sim",
      to: "cache",
      fromSide: "right",
      toSide: "left",
      bend: 315,
      label: "Socket.IO, device namespace",
      labelPos: { x: 315, y: 470 },
    },
    {
      from: "native",
      to: "interlocks",
      fromSide: "right",
      toSide: "left",
      toAt: 0.8,
      bend: 360,
      dashed: true,
      label: "TCP probes",
    },
    { from: "interlocks", to: "cache", fromSide: "bottom", toSide: "top", toAt: 0.25, bend: 230 },
    { from: "automation", to: "cache", fromSide: "bottom", toSide: "top", toAt: 0.75, bend: 236 },
    { from: "cache", to: "writes", fromSide: "bottom", toSide: "top" },
    { from: "writes", to: "db", fromSide: "right", toSide: "left", bend: 720, label: "Prisma" },
    { from: "automation", to: "meteo", fromSide: "right", toSide: "left", bend: 745, dashed: true, label: "HTTPS" },
  ],
  decisions: [
    {
      title: "Two namespaces, two audiences",
      decision: "Device traffic and operator apps connect over two separate Socket.IO namespaces.",
      constraint:
        "Devices and operators have different message vocabularies and failure modes, and a real device-fleet backend keeps them apart.",
      rejected: "One namespace with message-type switching, which lets a buggy device broadcast into operator channels.",
      consequence: "Two connection paths to test, and the separation the schematic shows survives into the code.",
    },
    {
      title: "The server is the authority",
      decision:
        "Every safety-relevant decision runs server-side: low tank, offline device, latched emergency stop, already-running state, and a maximum-runtime auto-stop.",
      constraint: "The client can be stale, buggy, or hostile, and the pump is a physical actuator.",
      rejected: "Client-side guards in the app.",
      consequence: "The server carries the full state machine, and UI affordances can only ever be hints.",
    },
    {
      title: "Hot state in memory, history on disk",
      decision:
        "An in-memory device state cache serves safety checks and automation, with throttled writes to PostgreSQL as the durable record.",
      constraint:
        "A high-frequency telemetry stream would otherwise put a database round trip inside the safety path and grow the database without bound.",
      rejected: "Reading and writing Postgres on every message.",
      consequence:
        "Bounded database growth and fast checks, in exchange for buffered-loss risk on crash and a single-process cache.",
    },
    {
      title: "Decisions carry their reasoning",
      decision:
        "The automation engine is a pure rule function, and every decision is stored with its inputs and its reasoning.",
      constraint: "An automation that cannot explain a skipped irrigation is an automation operators will not trust.",
      rejected: "Logging outcomes only.",
      consequence:
        "\"Why did it skip irrigation at 6am\" has an answer in the database, and the function is unit-testable without hardware.",
    },
    {
      title: "A simulator with physics",
      decision:
        "The simulator is deterministic and physically grounded: a fixed daily temperature curve, relative humidity computed from temperature via the Magnus equation, temperature-scaled evaporation, and a stochastic rain probability model.",
      constraint: "There is no physical pump, and the system still has to be built and tested end to end.",
      rejected: "Canned telemetry replay, which cannot respond to commands.",
      consequence:
        "It connects over the exact protocol a real ESP32 or Raspberry Pi controller would use, so hardware can replace it without changing the backend or the app.",
    },
    {
      title: "Native code where JavaScript cannot go",
      decision:
        "A custom Android module in Java performs OS-level network diagnostics, running blocking checks on a background thread.",
      constraint: "Connection type, reachability, and honest latency to the backend are invisible to JavaScript.",
      rejected: "A community library reporting what the OS volunteers.",
      consequence: "Real diagnostics in the app, and an iOS implementation still owed behind the same bridge.",
    },
    {
      title: "Charts drawn by hand",
      decision: "Charts and the radial gauge are drawn directly in SVG rather than pulled from a charting library.",
      constraint: "The industrial look needs exact control of ticks, needles, and thresholds that chart libraries abstract away.",
      rejected: "A charting library themed to approximate the look.",
      consequence:
        "More drawing code owned in the repository, zero library weight, and a gauge that reads as an instrument instead of a widget.",
    },
  ],
  limitations: [
    "The device is simulated. That is a strength in one sense, a hardware-ready architecture built without hardware, but it must never be mistaken for a physical deployment.",
    "There is no authentication on the operator app.",
    "There is no fleet model: the system supervises one device.",
  ],
  stack: [
    { tech: "react-native", label: "React Native 0.86 (bare CLI)", group: "frontend", nodes: ["app"] },
    { tech: "typescript", label: "TypeScript", group: "frontend", nodes: ["app", "interlocks", "automation", "sim"] },
    { tech: "react-navigation", label: "React Navigation", group: "frontend", nodes: ["app"] },
    { tech: "zustand", label: "Zustand", group: "frontend", nodes: ["app"] },
    { tech: "socketio-client", label: "Socket.IO client", group: "frontend", nodes: ["app", "sim"] },
    { tech: "axios", label: "Axios", group: "frontend", nodes: ["app"] },
    { tech: "react-native-svg", label: "react-native-svg", group: "frontend", nodes: ["app"] },
    { tech: "asyncstorage", label: "AsyncStorage", group: "frontend", nodes: ["app"] },
    { tech: "java", label: "Java native module", group: "device", nodes: ["native"] },
    { tech: "connectivity-manager", label: "Android ConnectivityManager", group: "device", nodes: ["native"] },
    { tech: "raw-tcp", label: "Raw TCP sockets", group: "device", nodes: ["native"] },
    { tech: "gradle", label: "Gradle + Android SDK", group: "device", nodes: ["native"] },
    { tech: "node", label: "Node.js 22", group: "backend", nodes: ["interlocks", "automation", "cache", "writes"] },
    { tech: "express", label: "Express", group: "backend", nodes: ["interlocks"] },
    { tech: "socketio", label: "Socket.IO", group: "backend", nodes: ["interlocks", "cache"] },
    { tech: "prisma", label: "Prisma", group: "backend", nodes: ["writes", "db"] },
    { tech: "zod-validation", label: "Zod", group: "backend", nodes: ["interlocks"] },
    { tech: "native-fetch", label: "Native fetch", group: "backend", nodes: ["automation"] },
    { tech: "postgresql", label: "PostgreSQL 16", group: "data", nodes: ["db"] },
    { tech: "open-meteo", label: "Open-Meteo", group: "infra", nodes: ["meteo"] },
    { tech: "docker", label: "Docker", group: "infra", nodes: ["db"] },
    { tech: "docker-compose", label: "Docker Compose", group: "infra", nodes: ["db", "sim"] },
    { tech: "adminer", label: "Adminer", group: "infra", nodes: ["db"] },
    { tech: "github-actions", label: "GitHub Actions", group: "infra", nodes: ["app", "interlocks", "sim"] },
    { tech: "tsx", label: "tsx", group: "infra", nodes: ["interlocks", "sim"] },
    { tech: "metro", label: "Metro", group: "infra", nodes: ["app"] },
  ],
  metrics: [
    { value: "4", label: "cooperating services" },
    { value: "2", label: "Socket.IO namespaces" },
    { value: "7", label: "database tables" },
    { value: "6", label: "alert classes with acknowledgement" },
    { value: "3", label: "services type-checked by CI on every push" },
  ],
  trace: {
    mode: "recorded",
    description:
      "Not publicly deployed. Timings shown here are captured from a real local run, never invented.",
  },
  screens: [
    {
      src: "/screens/agripulse/02-dashboard.png",
      alt: "The AgriPulse operator dashboard on a phone, showing a soil moisture gauge, pump state, tank level, weather, and a warning alert",
      caption:
        "The operator panel. The radial gauge is drawn in SVG rather than pulled from a charting library, and the pump reads STOPPED with its valve closed.",
      width: 800,
      height: 1778,
    },
    {
      src: "/screens/agripulse/04-network-diagnostics.png",
      alt: "The AgriPulse network diagnostics screen reporting the Java native module as loaded, with connection type and backend latency",
      caption:
        "The Java native module reporting connection type and measured latency to the backend and the socket port. JavaScript cannot see any of this.",
      width: 800,
      height: 1778,
    },
    {
      src: "/screens/agripulse/03-settings.png",
      alt: "The AgriPulse device settings screen with automation thresholds for moisture, rain probability, and tank level",
      caption:
        "The thresholds the automation rule function reads: moisture minimum, rain probability ceiling, tank minimum.",
      width: 800,
      height: 1778,
    },
    {
      src: "/screens/agripulse/01-operator.png",
      alt: "The AgriPulse welcome screen, noting that no account is needed in demo mode",
      caption:
        "The entry screen. No account needed is literal: there is no authentication on the operator app.",
      width: 800,
      height: 1778,
    },
  ],
  readerSummary:
    "A real-time mobile control panel for a smart irrigation pump, built to behave like an industrial controller. React Native operator app with a Java native module for OS-level network diagnostics, Node 22 backend with server-authoritative safety interlocks, a pure-function weather automation engine that stores its reasoning, and a deterministic, physics-grounded device simulator speaking the exact protocol real hardware would. The device is simulated, and labelled so.",
};
