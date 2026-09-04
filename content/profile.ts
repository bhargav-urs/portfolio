import type { Profile } from "./types";

export const profile: Profile = {
  name: "Bhargav Urs Sumantharaj",
  shortName: "Bhargav Urs",
  role: "Full-stack software engineer",
  location: "Arlington, Texas",
  email: "sbhargavurs1442001@gmail.com",
  github: {
    label: "GitHub",
    href: "https://github.com/Bhargav-Urs",
    host: "github.com",
  },
  linkedin: {
    label: "LinkedIn",
    href: "https://linkedin.com/in/bhargav-urs",
    host: "linkedin.com",
  },
  resumeHref: "/resume.pdf",
  headlineStats: [
    { value: "5", label: "systems on this console" },
    { value: "3", label: "live deployments" },
    { value: "3.75", label: "GPA, MS Computer Science, UT Arlington" },
  ],
  about:
    "I build full systems: the schema, the service, the interface, and the pipeline that ships them. My backend home is Java and Spring Boot; my frontend home is Next.js and TypeScript. The five systems on this console are the honest record of how I work. Each one has a schematic you can click through, the decisions behind it, and a plain statement of what would break first.\n\nI care about the parts of engineering that survive contact with production: connection pools sized to real quotas, auth that stays valid across restarts, queries verified with EXPLAIN rather than assumed, failure paths designed before they are needed. Where something broke in production, the diagnosis is documented here too, because debugging under pressure is the skill interviews try hardest to find and portfolios show least.\n\nI finished my MS in Computer Science at the University of Texas at Arlington in December 2025, and I am looking for a software engineering role, full-stack or backend, on a team that reviews code seriously and ships often. The fastest way to evaluate me is to open a schematic and start clicking.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://bhargavurs.me",
};
