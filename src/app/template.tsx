import { ViewTransition } from "react";
import type { ReactNode } from "react";

/** Map the navigation's transition type to the slide classes in globals.css. */
const SLIDE = {
  "nav-forward": "page-forward",
  "nav-back": "page-back",
  default: "none",
};

/**
 * Remounts on every route change, so the outgoing page gets an exit and the
 * incoming page gets an enter. Navigations without a type (browser back,
 * refresh) swap instantly.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={SLIDE} exit={SLIDE} default="none">
      {children}
    </ViewTransition>
  );
}
