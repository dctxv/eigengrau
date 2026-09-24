import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { useDigitShortcutsEnabled } from "./digitShortcuts";

const TYPING_TARGETS =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]';

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest(TYPING_TARGETS) !== null;
}

/**
 * Digits 1 to 6 jump to the matching route, unless the user is typing, holding
 * a modifier, or has turned the shortcuts off. Returns whether they are on.
 */
export function useDigitNavigation() {
  const router = useRouter();
  const enabled = useDigitShortcutsEnabled();

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;
      const route = ROUTES.find((r) => String(r.digit) === event.key);
      if (route) router.push(route.href);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, enabled]);

  return enabled;
}
