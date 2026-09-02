import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { profile } from "@/content";

import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "optional",
  axes: ["wdth"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "optional",
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex",
  display: "optional",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: {
    default: profile.name,
    template: `%s · ${profile.name}`,
  },
  description:
    "Full-stack software engineer in Arlington, Texas. Five shipped systems, each with a clickable architecture schematic, a decision log, and honest live status.",
};

export const viewport: Viewport = {
  themeColor: "#DDE2DC",
};

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  email: `mailto:${profile.email}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Arlington",
    addressRegion: "TX",
    addressCountry: "US",
  },
  url: profile.siteUrl,
  sameAs: [profile.github.href, profile.linkedin.href],
};

const finishInit = `(function(){try{if(localStorage.getItem("finish")==="dark"){document.documentElement.setAttribute("data-finish","dark")}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${newsreader.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: finishInit }} />
        <a href="#plate" className="skip-link">
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
