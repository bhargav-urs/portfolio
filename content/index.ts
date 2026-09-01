import { z } from "zod";

import { agripulse } from "./subsystems/agripulse";
import { chainvote } from "./subsystems/chainvote";
import { convergeai } from "./subsystems/convergeai";
import { findspace } from "./subsystems/findspace";
import { mappedin } from "./subsystems/mappedin";
import { profile as rawProfile } from "./profile";
import { education as rawEducation, roles as rawRoles } from "./experience";
import {
  educationSchema,
  profileSchema,
  roleSchema,
  subsystemSchema,
  type Education,
  type Profile,
  type Role,
  type Slug,
  type Subsystem,
} from "./types";

/**
 * Everything is validated once at module load, so a malformed content
 * entry fails the build instead of rendering a broken plate.
 */

const ordered = [findspace, convergeai, mappedin, chainvote, agripulse];

export const subsystems: Subsystem[] = z.array(subsystemSchema).parse(ordered);

export const subsystemBySlug: Record<Slug, Subsystem> = Object.fromEntries(
  subsystems.map((s) => [s.slug, s]),
) as Record<Slug, Subsystem>;

export const profile: Profile = profileSchema.parse(rawProfile);
export const roles: Role[] = z.array(roleSchema).parse(rawRoles);
export const education: Education[] = z.array(educationSchema).parse(rawEducation);

export { DEFAULT_SLUG } from "@/lib/consts";

export { SLUGS } from "./types";
export type { Slug, Subsystem, SchematicNode, NodeDetail } from "./types";
