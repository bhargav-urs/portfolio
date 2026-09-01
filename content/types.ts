import { z } from "zod";

export const SLUGS = [
  "findspace",
  "convergeai",
  "mappedin",
  "chainvote",
  "agripulse",
] as const;

export const slugSchema = z.enum(SLUGS);
export type Slug = z.infer<typeof slugSchema>;

export const nodeKindSchema = z.enum(["client", "service", "datastore", "external"]);
export type NodeKind = z.infer<typeof nodeKindSchema>;

export const sideSchema = z.enum(["top", "right", "bottom", "left"]);
export type Side = z.infer<typeof sideSchema>;

/** The four mandatory answers behind every node. */
export const nodeDetailSchema = z.object({
  role: z.string().min(1),
  why: z.string().min(1),
  rejected: z.string().min(1),
  breaks: z.string().min(1),
});
export type NodeDetail = z.infer<typeof nodeDetailSchema>;

export const schematicNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Optional second line in machine face: host, version, port. */
  sub: z.string().optional(),
  kind: nodeKindSchema,
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  detail: nodeDetailSchema,
});
export type SchematicNode = z.infer<typeof schematicNodeSchema>;

export const schematicEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  /** Protocol label, set only when the wire carries a named protocol. */
  label: z.string().optional(),
  fromSide: sideSchema,
  toSide: sideSchema,
  /** 0..1 position of the port along its side. Defaults to the middle. */
  fromAt: z.number().min(0).max(1).optional(),
  toAt: z.number().min(0).max(1).optional(),
  /** Absolute coordinate of the middle segment for three-leg routes. */
  bend: z.number().optional(),
  /** Hand-placed label centre, when the automatic anchor would collide. */
  labelPos: z.object({ x: z.number(), y: z.number() }).optional(),
  dashed: z.boolean().optional(),
});
export type SchematicEdge = z.infer<typeof schematicEdgeSchema>;

export const boundarySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  note: z.string().optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});
export type Boundary = z.infer<typeof boundarySchema>;

export const decisionSchema = z.object({
  title: z.string().min(1),
  decision: z.string().min(1),
  constraint: z.string().min(1),
  rejected: z.string().min(1),
  consequence: z.string().min(1),
});
export type Decision = z.infer<typeof decisionSchema>;

export const stackEntrySchema = z.object({
  /** Canonical id shared across subsystems, so one chip lights every user. */
  tech: z.string().min(1),
  label: z.string().min(1),
  group: z.enum(["frontend", "backend", "data", "contracts", "device", "infra", "testing", "standards"]),
  /** Node ids in this subsystem where the technology actually runs. */
  nodes: z.array(z.string().min(1)).min(1),
});
export type StackEntry = z.infer<typeof stackEntrySchema>;

export const metricSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});
export type Metric = z.infer<typeof metricSchema>;

export const externalLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
  /** Visible destination cue rendered next to the label. */
  host: z.string().min(1),
  note: z.string().optional(),
});
export type ExternalLink = z.infer<typeof externalLinkSchema>;

export const traceConfigSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("live"),
    /** Allowlisted key understood by /api/trace. */
    target: z.string().min(1),
    description: z.string().min(1),
  }),
  z.object({
    mode: z.literal("recorded"),
    description: z.string().min(1),
  }),
]);
export type TraceConfig = z.infer<typeof traceConfigSchema>;

export const screenSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type Screen = z.infer<typeof screenSchema>;

export const subsystemSchema = z
  .object({
    slug: slugSchema,
    name: z.string().min(1),
    oneLine: z.string().min(1),
    /** checked: /api/status probes it. static: labelled state, no probe. */
    statusMode: z.enum(["checked", "static"]),
    staticStatusNote: z.string().optional(),
    coldStartNote: z.string().optional(),
    live: externalLinkSchema.optional(),
    repo: externalLinkSchema,
    extraLinks: z.array(externalLinkSchema).optional(),
    canvas: z.object({ w: z.number(), h: z.number() }),
    nodes: z.array(schematicNodeSchema).min(3),
    edges: z.array(schematicEdgeSchema).min(2),
    boundaries: z.array(boundarySchema),
    /** The one earned numbered sequence on the site (ConvergeAI phases). */
    sequence: z
      .object({ title: z.string().min(1), steps: z.array(z.string().min(1)).min(2) })
      .optional(),
    decisions: z.array(decisionSchema).min(1),
    limitations: z.array(z.string().min(1)).min(1),
    stack: z.array(stackEntrySchema).min(1),
    metrics: z.array(metricSchema).min(1),
    trace: traceConfigSchema,
    screens: z.array(screenSchema),
    readerSummary: z.string().min(1),
  })
  .superRefine((s, ctx) => {
    const ids = new Set(s.nodes.map((n) => n.id));
    if (ids.size !== s.nodes.length) {
      ctx.addIssue({ code: "custom", message: `${s.slug}: duplicate node ids` });
    }
    for (const e of s.edges) {
      for (const end of [e.from, e.to]) {
        if (!ids.has(end)) {
          ctx.addIssue({ code: "custom", message: `${s.slug}: edge endpoint "${end}" is not a node` });
        }
      }
    }
    for (const st of s.stack) {
      for (const n of st.nodes) {
        if (!ids.has(n)) {
          ctx.addIssue({ code: "custom", message: `${s.slug}: stack entry "${st.tech}" points at missing node "${n}"` });
        }
      }
    }
  });
export type Subsystem = z.infer<typeof subsystemSchema>;

export const roleSchema = z.object({
  org: z.string().min(1),
  title: z.string().min(1),
  location: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1),
  impact: z.string().min(1),
  bullets: z.array(z.string().min(1)),
});
export type Role = z.infer<typeof roleSchema>;

export const educationSchema = z.object({
  school: z.string().min(1),
  degree: z.string().min(1),
  location: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1),
  detail: z.string().optional(),
});
export type Education = z.infer<typeof educationSchema>;

export const profileSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  email: z.string().email(),
  github: externalLinkSchema,
  linkedin: externalLinkSchema,
  resumeHref: z.string().min(1),
  headlineStats: z.array(metricSchema).length(3),
  about: z.string().min(1),
  siteUrl: z.string().url(),
});
export type Profile = z.infer<typeof profileSchema>;
