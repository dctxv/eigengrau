"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Frame } from "@/components/Frame";
import { cn } from "@/lib/cn";
import { ROUTES, SITE_NAME, slideDirection } from "@/lib/routes";
import { useDigitNavigation } from "./useDigitNavigation";

const LINK = "inline-flex h-8 items-center leading-none focus-visible:-outline-offset-3";
const SEGMENT = "backdrop-blur-md transition-colors";

/**
 * Fixed row of segments at the top centre: the brand, then one segment per
 * route. A route's segment is minimised to its serif digit until it is the
 * current one, when it opens up to show the label with a superscript digit.
 * The open and close animate through the nav-* classes in globals.css.
 * Digits 1 to 6 navigate unless turned off in the colophon.
 *
 * Active state is an exact pathname match. Prefix matching would disagree
 * between the prerendered 404 page and the client; when nested routes arrive,
 * read useSelectedLayoutSegment() instead, which is the same on both sides.
 */
export function PillNav() {
  const pathname = usePathname();
  const shortcuts = useDigitNavigation(pathname);

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center [--corner:6px]"
    >
      <ul className="nav-list pointer-events-auto flex items-center gap-1 text-[13px] tracking-[-0.01em]">
        <Frame as="li" innerClassName={cn(SEGMENT, "bg-surface-1/85")}>
          <Link
            href="/"
            transitionTypes={[slideDirection(pathname, "/")]}
            className={cn(LINK, "px-3 font-semibold text-text-1")}
          >
            {SITE_NAME}
          </Link>
        </Frame>
        {ROUTES.map((route) => {
          const active = pathname === route.href;
          return (
            <Frame
              as="li"
              key={route.href}
              innerClassName={cn(
                SEGMENT,
                active ? "bg-surface-2/85" : "bg-surface-1/85 hover:bg-surface-2/85",
              )}
            >
              <Link
                href={route.href}
                transitionTypes={[slideDirection(pathname, route.href)]}
                aria-label={`${route.label} ${route.digit}`}
                aria-current={active ? "page" : undefined}
                aria-keyshortcuts={shortcuts ? String(route.digit) : undefined}
                className={cn(
                  LINK,
                  "relative px-2.5 transition-colors",
                  active ? "text-text-1" : "text-text-2 hover:text-text-1",
                )}
              >
                <span className="nav-label">
                  <span>{route.label}</span>
                </span>
                <span aria-hidden="true" className="nav-digit font-serif tracking-normal">
                  {route.digit}
                </span>
                <span aria-hidden="true" className="nav-mark absolute inset-x-2.5 bottom-0 h-px bg-facet" />
              </Link>
            </Frame>
          );
        })}
      </ul>
    </nav>
  );
}
