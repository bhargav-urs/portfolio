import { ImageResponse } from "next/og";

import { profile, subsystemBySlug } from "@/content";
import { slugSchema } from "@/content/types";
import { CHANNEL_HEX, loadArchivo, OG_COLORS } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Subsystem schematic summary";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = slugSchema.parse(slug);
  const subsystem = subsystemBySlug[parsed];
  const channel = CHANNEL_HEX[parsed] ?? OG_COLORS.ink;
  const [semibold, medium] = await Promise.all([loadArchivo(600), loadArchivo(500)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: OG_COLORS.panel,
          fontFamily: "Archivo",
          color: OG_COLORS.ink,
        }}
      >
        <div style={{ width: 22, height: "100%", background: channel }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "72px 80px",
            flex: 1,
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 500, color: OG_COLORS.inkSoft }}>
            {profile.name}
          </div>
          <div style={{ fontSize: 84, fontWeight: 600, marginTop: 28, letterSpacing: -1 }}>
            {subsystem.name}
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              color: OG_COLORS.inkSoft,
              marginTop: 24,
              lineHeight: 1.35,
              maxWidth: 940,
            }}
          >
            {subsystem.oneLine}
          </div>
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 26,
              color: OG_COLORS.inkSoft,
            }}
          >
            <div style={{ width: 16, height: 16, background: channel }} />
            <div>{`${subsystem.nodes.length} schematic nodes, every one with its reasoning`}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: semibold, weight: 600 },
        { name: "Archivo", data: medium, weight: 500 },
      ],
    },
  );
}
