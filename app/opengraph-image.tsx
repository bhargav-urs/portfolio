import { ImageResponse } from "next/og";

import { profile, subsystems } from "@/content";
import { CHANNEL_HEX, loadArchivo, OG_COLORS } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${profile.name}, ${profile.role}`;

export default async function OgImage() {
  const [semibold, medium] = await Promise.all([loadArchivo(600), loadArchivo(500)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: OG_COLORS.panel,
          padding: "72px 80px",
          fontFamily: "Archivo",
          color: OG_COLORS.ink,
        }}
      >
        <div style={{ display: "flex", gap: 0, height: 10 }}>
          {subsystems.map((s) => (
            <div
              key={s.slug}
              style={{ flex: 1, background: CHANNEL_HEX[s.slug] ?? OG_COLORS.ink }}
            />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -1 }}>{profile.name}</div>
          <div style={{ fontSize: 34, fontWeight: 500, color: OG_COLORS.inkSoft, marginTop: 16 }}>
            {`${profile.role}, ${profile.location}`}
          </div>
          <div style={{ fontSize: 26, color: OG_COLORS.inkSoft, marginTop: 40 }}>
            {`${subsystems.length} systems, each with a clickable schematic and its decisions`}
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
