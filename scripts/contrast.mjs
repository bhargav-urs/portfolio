// Computes WCAG-compliant lightness variants of the channel colours.
// Run: node scripts/contrast.mjs
// Output is pasted into app/globals.css by hand so the shipped CSS is static.

const hex = (s) => {
  const n = parseInt(s.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = ([r, g, b]) =>
  "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");

const lum = ([r, g, b]) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const rgbToHsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
};
const hslToRgb = ([h, s, l]) => {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
};

// Walk lightness until the colour clears `ratio` against `ground`.
const adjust = (color, ground, ratio, direction) => {
  const [h, s, l] = rgbToHsl(hex(color));
  let cur = l;
  for (let i = 0; i < 200; i++) {
    const rgb = hslToRgb([h, s, cur]);
    if (contrast(rgb, hex(ground)) >= ratio) return toHex(rgb);
    cur += direction * 0.005;
    if (cur <= 0.02 || cur >= 0.98) break;
  }
  return toHex(hslToRgb([h, s, cur]));
};

const channels = {
  findspace: "#7A5C3E",
  converge: "#5B4B8A",
  mappedin: "#2E6E5B",
  chainvote: "#A6791F",
  agripulse: "#35607A",
};

const lightRecess = "#C9CFC8"; // darkest ground in the light finish
const darkRaised = "#2E3431"; // lightest ground in the dark finish

console.log("light finish, text-grade channel variants (>= 4.5:1 on recess):");
for (const [k, v] of Object.entries(channels)) {
  const deep = adjust(v, lightRecess, 4.5, -1);
  console.log(`  --ch-${k}-deep: ${deep};  /* base ${v} was ${contrast(hex(v), hex(lightRecess)).toFixed(2)}:1, now ${contrast(hex(deep), hex(lightRecess)).toFixed(2)}:1 */`);
}

console.log("dark finish, text-grade channel variants (>= 4.5:1 on raised):");
for (const [k, v] of Object.entries(channels)) {
  const lift = adjust(v, darkRaised, 4.5, +1);
  console.log(`  --ch-${k}-lift: ${lift};  /* ${contrast(hex(lift), hex(darkRaised)).toFixed(2)}:1 */`);
}

console.log("secondary ink on light recess:");
const softDeep = adjust("#55605B", lightRecess, 4.5, -1);
console.log(`  --ink-soft-deep: ${softDeep};  /* ${contrast(hex(softDeep), hex(lightRecess)).toFixed(2)}:1 */`);

console.log("spot checks:");
const checks = [
  ["ink on panel", "#191D1C", "#DDE2DC"],
  ["ink on recess", "#191D1C", "#C9CFC8"],
  ["ink on raised", "#191D1C", "#EAEEE8"],
  ["ink-soft on panel", "#55605B", "#DDE2DC"],
  ["live lamp on panel", "#3F7D4E", "#DDE2DC"],
  ["waking lamp on panel", "#B07C1E", "#DDE2DC"],
  ["offline lamp on panel", "#8C3A32", "#DDE2DC"],
];
for (const [name, a, b] of checks) {
  console.log(`  ${name}: ${contrast(hex(a), hex(b)).toFixed(2)}:1`);
}
