"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Frame } from "@/components/Frame";
import { cn } from "@/lib/cn";
import { ROUTES, SITE_NAME } from "@/lib/routes";
import { useDigitNavigation } from "./useDigitNavigation";

const LINK = "inline-flex h-8.5 items-center leading-none focus-visible:-outline-offset-3";

/**
 * Fixed pill at the top centre: brand, a hairline, then the six routes.
 * Labels collapse to their serif digits on phones. Digits 1 to 6 navigate
 * unless that has been turned off in the colophon.
 *
 * Active state is an exact pathname match. Prefix matching would disagree
 * between the prerendered 404 page and the client; when nested routes arrive,
 * read useSelectedLayoutSegment() instead, which is the same on both sides.
 */
export function PillNav() {
  const pathname = usePathname();
  const shortcuts = useDigitNavigation();

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center"
    >
      <Frame className="pointer-events-auto" innerClassName="bg-surface-1/85 px-2 backdrop-blur-md">
        <ul className="flex items-center text-[13px] tracking-[-0.01em]">
          <li>
            <Link href="/" className={cn(LINK, "px-3 font-medium text-text-1")}>
              {SITE_NAME}
            </Link>
          </li>
          <li role="presentation" aria-hidden="true" className="h-4 w-px bg-line" />
          {ROUTES.map((route) => {
            const active = pathname === route.href;
            return (
              <li key={route.href}>
                <Link
                  href={route.href}
                  aria-label={`${route.label} ${route.digit}`}
                  aria-current={active ? "page" : undefined}
                  aria-keyshortcuts={shortcuts ? String(route.digit) : undefined}
                  className={cn(
                    LINK,
                    "relative px-2.5 transition-colors duration-150",
                    active ? "text-text-1" : "text-text-2 hover:text-text-1",
                  )}
                >
                  <span className="sr-only sm:not-sr-only">{route.label}</span>
                  <span
                    aria-hidden="true"
                    className="font-serif text-[14px] tracking-normal sm:relative sm:-top-[0.5em] sm:ml-0.5 sm:text-[0.72em]"
                  >
                    {route.digit}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-1.5 bottom-0 h-px bg-facet sm:inset-x-2.5"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </Frame>
    </nav>
  );
}
