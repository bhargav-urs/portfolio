/**
 * Build-time font loading for the OG images. Google returns TTF sources
 * to a plain fetch, which is what ImageResponse needs.
 */
export async function loadArchivo(weight: 500 | 600 | 700): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Archivo:wght@${weight}&display=swap`,
  ).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\)/)?.[1];
  if (!url) throw new Error("font source not found in stylesheet");
  return fetch(url).then((r) => r.arrayBuffer());
}

export const OG_COLORS = {
  panel: "#DDE2DC",
  recess: "#C9CFC8",
  ink: "#191D1C",
  inkSoft: "#55605B",
} as const;

export const CHANNEL_HEX: Record<string, string> = {
  findspace: "#7A5C3E",
  convergeai: "#5B4B8A",
  mappedin: "#2E6E5B",
  chainvote: "#A6791F",
  agripulse: "#35607A",
};
