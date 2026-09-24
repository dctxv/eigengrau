"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** UI motion defaults: short springs, and reduced motion honoured from the OS. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ type: "spring", duration: 0.2, bounce: 0 }}
    >
      {children}
    </MotionConfig>
  );
}
