"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** UI motion defaults: slow in, fast through, slow out. Reduced motion is honoured from the OS. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}>
      {children}
    </MotionConfig>
  );
}
