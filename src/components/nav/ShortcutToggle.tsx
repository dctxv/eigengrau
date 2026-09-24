"use client";

import { Pairing } from "@/components/Pairing";
import { cn } from "@/lib/cn";
import { setDigitShortcuts, useDigitShortcutsEnabled } from "./digitShortcuts";

/** Switches the digit shortcuts on or off. The choice is kept in this browser. */
export function ShortcutToggle({ className }: { className?: string }) {
  const enabled = useDigitShortcutsEnabled();
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={() => setDigitShortcuts(!enabled)}
      className={cn(
        "inline-block text-[15px] text-text-2 underline decoration-line underline-offset-4 hover:text-text-1",
        className,
      )}
    >
      <Pairing lead="Digit shortcuts" tail={enabled ? "on" : "off"} />
    </button>
  );
}
