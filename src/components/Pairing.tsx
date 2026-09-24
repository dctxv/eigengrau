import type { ElementType } from "react";
import { cn } from "@/lib/cn";

type PairingProps = {
  /** Grotesk, first half of the line. */
  lead: string;
  /** Serif, second half of the line. */
  tail: string;
  as?: ElementType;
  className?: string;
  /** Serif half in italic (default) or upright. */
  italic?: boolean;
};

/**
 * The pairing rule: grotesk first half, serif second half.
 * e.g. lead="Now playing" tail="via last.fm"
 */
export function Pairing({ lead, tail, as: Tag = "span", className, italic = true }: PairingProps) {
  return (
    <Tag className={cn("font-sans", className)}>
      {lead}{" "}
      <span
        className={cn(
          "font-serif font-normal tracking-normal text-[1.06em]",
          italic && "italic",
        )}
      >
        {tail}
      </span>
    </Tag>
  );
}
