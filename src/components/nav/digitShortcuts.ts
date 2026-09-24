import { useSyncExternalStore } from "react";

/**
 * Whether the digit shortcuts (1 to 6) are switched on. Off is remembered in
 * this browser; the default, and what the server renders, is on.
 */
const KEY = "digit-nav";
const listeners = new Set<() => void>();

let current: boolean | null = null;

function read(): boolean {
  if (current === null) {
    try {
      current = window.localStorage.getItem(KEY) !== "off";
    } catch {
      current = true;
    }
  }
  return current;
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== null && event.key !== KEY) return;
    current = null;
    onChange();
  }
  listeners.add(onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setDigitShortcuts(on: boolean) {
  current = on;
  try {
    if (on) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, "off");
  } catch {
    // Storage is unavailable: the choice lasts for this page load only.
  }
  listeners.forEach((notify) => notify());
}

export function useDigitShortcutsEnabled() {
  return useSyncExternalStore(subscribe, read, () => true);
}
