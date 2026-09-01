import { OpenPaletteButton } from "@/components/shell/OpenPaletteButton";
import { Shell } from "@/components/shell/Shell";

export default function NotFound() {
  return (
    <Shell>
      <div className="px-6 py-16 md:px-10">
        <h1 className="text-xl font-semibold">No subsystem at that address.</h1>
        <p className="prose-reading mt-3 text-base">
          The rail lists everything this console supervises. Or search every node, decision,
          and page directly:
        </p>
        <OpenPaletteButton />
      </div>
    </Shell>
  );
}
