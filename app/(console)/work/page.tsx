import type { Metadata } from "next";

import { education, roles } from "@/content";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Experience and education of Bhargav Urs Sumantharaj, as a ledger: what each role was, and what changed because of it.",
};

export default function WorkPage() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="condensed text-2xl font-semibold">Work</h1>
      <p className="prose-reading mt-2 text-md text-ink-soft">
        A ledger, not a timeline: each row expands to what changed because I was there.
      </p>

      <ul className="mt-6 max-w-3xl">
        {roles.map((role) => (
          <li key={role.org} className="hairline-t">
            <details className="group">
              <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-6 gap-y-1 py-4 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium">
                    {role.title}, {role.org}
                  </span>
                  <span className="prose-reading mt-0.5 block text-sm text-ink-soft">
                    {role.impact}
                  </span>
                </span>
                <span className="tnum shrink-0 text-sm text-ink-soft">
                  {role.start} to {role.end}
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xs text-ink-soft group-open:hidden"
                >
                  expand
                </span>
                <span
                  aria-hidden="true"
                  className="hidden shrink-0 text-xs text-ink-soft group-open:inline"
                >
                  collapse
                </span>
              </summary>
              <div className="pb-5 pl-4">
                <p className="text-xs text-ink-soft">{role.location}</p>
                <ul className="mt-2 space-y-2">
                  {role.bullets.map((b, i) => (
                    <li key={i} className="prose-reading border-l-2 border-hairline-strong pl-4 text-base">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </li>
        ))}
      </ul>

      <h2 className="condensed mt-10 text-lg font-semibold">Education</h2>
      <ul className="mt-3 max-w-3xl">
        {education.map((e) => (
          <li
            key={e.school}
            className="hairline-t flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium">
                {e.degree}, {e.school}
              </span>
              <span className="mt-0.5 block text-sm text-ink-soft">
                {e.location}
                {e.detail ? `. ${e.detail}` : ""}
              </span>
            </span>
            <span className="tnum shrink-0 text-sm text-ink-soft">
              {e.start} to {e.end}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
