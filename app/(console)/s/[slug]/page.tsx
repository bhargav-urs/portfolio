import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SubsystemPlate } from "@/components/plate/SubsystemPlate";
import { SLUGS, subsystemBySlug } from "@/content";
import { slugSchema } from "@/content/types";

export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return {};
  const subsystem = subsystemBySlug[parsed.data];
  return {
    title: subsystem.name,
    description: subsystem.oneLine,
  };
}

export default async function SubsystemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) notFound();
  const subsystem = subsystemBySlug[parsed.data];
  return <SubsystemPlate key={subsystem.slug} subsystem={subsystem} />;
}
