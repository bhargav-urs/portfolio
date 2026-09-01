import { SubsystemPlate } from "@/components/plate/SubsystemPlate";
import { DEFAULT_SLUG, subsystemBySlug } from "@/content";

export default function Home() {
  const subsystem = subsystemBySlug[DEFAULT_SLUG];
  return <SubsystemPlate key={subsystem.slug} subsystem={subsystem} />;
}
