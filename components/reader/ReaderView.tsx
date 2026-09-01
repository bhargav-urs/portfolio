"use client";

import Link from "next/link";

import { allSubsystems, education, profile, roles } from "@/content/client";

function PrintableLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="print-url underline underline-offset-2"
      data-href={href.replace(/^https?:\/\//, "")}
    >
      {children}
    </a>
  );
}

export function ReaderView() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-8 flex items-center justify-between">
        <p className="text-xs text-ink-soft">
          The fast read. The console view holds the schematics, decisions, and live traces.
        </p>
        <Link
          href="/?view=console"
          className="plate px-3 py-1.5 text-sm font-medium"
        >
          Console view
        </Link>
      </div>

      <header>
        <h1 className="text-xl font-semibold">{profile.name}</h1>
        <p className="mt-1 text-base text-ink-soft">
          {profile.role}, {profile.location}
        </p>
        <p className="mt-2 text-sm">
          <a className="underline underline-offset-2" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <span className="mx-2 text-ink-soft">/</span>
          <PrintableLink href={profile.github.href}>GitHub</PrintableLink>
          <span className="mx-2 text-ink-soft">/</span>
          <PrintableLink href={profile.linkedin.href}>LinkedIn</PrintableLink>
          <span className="mx-2 text-ink-soft">/</span>
          <a className="underline underline-offset-2" href={profile.resumeHref} download>
            Resume PDF
          </a>
        </p>
      </header>

      <dl className="hairline-t hairline-b mt-5 flex gap-10 py-3">
        {profile.headlineStats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-ink-soft">{s.label}</dt>
            <dd className="tnum text-lg font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-7" aria-labelledby="reader-systems">
        <h2 id="reader-systems" className="text-md font-semibold">
          Systems
        </h2>
        <ul className="mt-3 space-y-5">
          {allSubsystems.map((s) => (
            <li key={s.slug} className={`channel-${s.slug}`}>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 className="text-base font-semibold">{s.name}</h3>
                <span className="text-xs text-ink-soft">
                  {s.live ? "live" : (s.staticStatusNote ?? "in the repository")}
                </span>
                {s.live ? <PrintableLink href={s.live.href}>{s.live.host}</PrintableLink> : null}
                <PrintableLink href={s.repo.href}>repository</PrintableLink>
              </div>
              <p className="prose-reading mt-1 text-sm">{s.readerSummary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7" aria-labelledby="reader-work">
        <h2 id="reader-work" className="text-md font-semibold">
          Work
        </h2>
        <ul className="mt-3 space-y-3">
          {roles.map((r) => (
            <li key={r.org} className="flex flex-wrap items-baseline justify-between gap-x-6">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {r.title}, {r.org}
                </p>
                <p className="prose-reading mt-0.5 text-sm text-ink-soft">{r.impact}</p>
              </div>
              <p className="tnum shrink-0 text-xs text-ink-soft">
                {r.start} to {r.end}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7" aria-labelledby="reader-education">
        <h2 id="reader-education" className="text-md font-semibold">
          Education
        </h2>
        <ul className="mt-3 space-y-2">
          {education.map((e) => (
            <li key={e.school} className="flex flex-wrap items-baseline justify-between gap-x-6">
              <p className="text-sm">
                <span className="font-medium">{e.degree}</span>, {e.school}.{" "}
                <span className="text-ink-soft">{e.detail}</span>
              </p>
              <p className="tnum shrink-0 text-xs text-ink-soft">
                {e.start} to {e.end}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
