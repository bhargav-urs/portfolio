"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Lamp } from "@/components/Lamp";
import { useStatus } from "@/components/StatusProvider";
import { profile, railItems } from "@/content/client";
import { DEFAULT_SLUG } from "@/lib/consts";

function readerHref(): string {
  return "/?view=reader";
}

function SubsystemRow({
  item,
  active,
  dimmed,
  horizontal,
  tech,
}: {
  item: (typeof railItems)[number];
  active: boolean;
  dimmed: boolean;
  horizontal: boolean;
  tech: string | null;
}) {
  const { serviceFor, payload } = useStatus();
  const service = serviceFor(item.slug);
  const state = item.statusMode === "static" ? "unknown" : service.state;
  const word = item.statusMode === "static" ? "not deployed" : service.state;
  const settling = item.statusMode === "checked" && payload !== null;

  return (
    <Link
      href={tech ? `/s/${item.slug}?tech=${encodeURIComponent(tech)}` : `/s/${item.slug}`}
      aria-current={active ? "page" : undefined}
      className={`channel-${item.slug} flex items-center gap-2.5 px-4 py-2.5 text-sm transition-opacity ${
        horizontal ? "shrink-0 border-b-2" : "border-l-2"
      } ${
        active
          ? "border-channel bg-raised font-medium"
          : "border-transparent hover:bg-raised"
      } ${dimmed ? "opacity-40" : ""}`}
    >
      <span className="flex-1 whitespace-nowrap">{item.name}</span>
      {horizontal ? (
        <span className="sr-only-list">{word}</span>
      ) : (
        <Lamp state={state} word={word} settling={settling} />
      )}
    </Link>
  );
}

export function Rail({
  tech,
  onOpenPalette,
}: {
  tech: string | null;
  onOpenPalette: () => void;
}) {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith("/s/") ? pathname.slice(3).split("/")[0] : null;
  const isDefaultRoute = pathname === "/";

  const rows = (horizontal: boolean) =>
    railItems.map((item) => (
      <SubsystemRow
        key={item.slug}
        item={item}
        tech={tech}
        horizontal={horizontal}
        active={activeSlug === item.slug || (isDefaultRoute && item.slug === DEFAULT_SLUG)}
        dimmed={tech !== null && !item.techs.has(tech)}
      />
    ));

  const pageLink = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={pathname === href ? "page" : undefined}
      className={`block px-4 py-2 text-sm hover:bg-raised ${
        pathname === href ? "bg-raised font-medium" : ""
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto rail:flex hairline-r">
        <div className="px-4 pb-4 pt-5">
          <p className="text-base font-semibold leading-tight">{profile.name}</p>
          <p className="mt-1 text-sm text-ink-soft">{profile.role}</p>
          <p className="text-xs text-ink-soft">{profile.location}</p>
        </div>
        <nav aria-label="Subsystems" className="hairline-t py-2">
          {rows(false)}
        </nav>
        <nav aria-label="Pages" className="hairline-t py-2">
          {pageLink("/about", "About")}
          {pageLink("/work", "Work")}
          <a
            href={profile.resumeHref}
            download
            className="block px-4 py-2 text-sm hover:bg-raised"
          >
            Resume
            <span className="ml-2 text-xs text-ink-soft">PDF</span>
          </a>
          <Link href={readerHref()} className="block px-4 py-2 text-sm hover:bg-raised">
            Reader view
            <span className="ml-2 text-xs text-ink-soft">for a fast read</span>
          </Link>
          <button
            type="button"
            onClick={onOpenPalette}
            className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-raised"
          >
            <span className="flex-1">Search</span>
            <kbd className="font-machine text-xs text-ink-soft">ctrl K</kbd>
          </button>
        </nav>
        <div className="hairline-t mt-auto px-4 py-4 text-xs text-ink-soft">
          <a className="block py-1 hover:text-ink" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <a
            className="block py-1 hover:text-ink"
            href={profile.github.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
            <span className="ml-1.5">{profile.github.host}</span>
          </a>
          <a
            className="block py-1 hover:text-ink"
            href={profile.linkedin.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
            <span className="ml-1.5">{profile.linkedin.host}</span>
          </a>
        </div>
      </aside>

      {/* Below 900px: the rail collapses to a horizontal selector pinned to the top. */}
      <header className="no-print sticky top-0 z-20 bg-panel rail:hidden">
        <div className="flex items-baseline justify-between px-4 pb-1 pt-3">
          <p className="text-sm font-semibold">{profile.name}</p>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/about" className="py-1">
              About
            </Link>
            <Link href="/work" className="py-1">
              Work
            </Link>
            <a href={profile.resumeHref} download className="py-1">
              Resume
            </a>
            <Link href={readerHref()} className="py-1">
              Reader
            </Link>
            <button type="button" onClick={onOpenPalette} className="py-1">
              Search
            </button>
          </div>
        </div>
        <nav
          aria-label="Subsystems"
          className="hairline-b flex overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {rows(true)}
        </nav>
      </header>
    </>
  );
}
