import type { Metadata } from "next";

import { profile } from "@/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Bhargav Urs Sumantharaj builds, how he works, and what he is looking for.",
};

export default function AboutPage() {
  const paragraphs = profile.about.split("\n\n");
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="condensed text-2xl font-semibold">About</h1>
      <div className="mt-5 space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="prose-reading text-md">
            {p}
          </p>
        ))}
      </div>
      <p className="mt-8 text-sm">
        <a className="underline underline-offset-2" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <span className="mx-2 text-ink-soft">/</span>
        <a
          className="underline underline-offset-2"
          href={profile.github.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
          <span className="ml-1.5 text-xs text-ink-soft">{profile.github.host}</span>
        </a>
        <span className="mx-2 text-ink-soft">/</span>
        <a
          className="underline underline-offset-2"
          href={profile.linkedin.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
          <span className="ml-1.5 text-xs text-ink-soft">{profile.linkedin.host}</span>
        </a>
      </p>
    </div>
  );
}
