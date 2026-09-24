import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CaptionProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

/**
 * Model-sheet caption: 11px grotesk caps, .12em tracking.
 * Always placed BELOW the thing it labels, never above as an eyebrow.
 * Write it as "front view / deadpan"; the caps come from CSS.
 */
export function Caption({ as: Tag = "span", className, children }: CaptionProps) {
  return <Tag className={cn("caption block", className)}>{children}</Tag>;
}
