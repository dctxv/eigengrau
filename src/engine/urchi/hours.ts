import { TIME_ZONE } from "@/content/site";

/**
 * Urchi keeps his hours: the time where Darius is (TIME_ZONE, or the
 * visitor's own zone until he sets one), and what that makes the hour. And
 * which night it is, for the night this browser last woke it: the first wake
 * of a night is a groggy one (acts.ts wakeGroggy), and any after it that
 * night the ordinary one. That is `localStorage["eigengrau:woken"]`, the
 * night's name (nightOf), every access guarded; private mode keeps it in
 * memory for the page's life.
 *
 * Debug knob, like character.ts's (ignored without a query string):
 *   ?hour=3      pretend it is 3 o'clock there (the minutes run as usual; ?hour=3:12 fixes them too)
 */

export type Hours = "day" | "late" | "night";
export type Clock = { h: number; m: number; hours: Hours; /** h:mm, "3:12" */ text: string };

/** 01:00-06:59 asleep, 23:00-00:59 drowsy, the rest awake. */
export function hoursOf(h: number): Hours {
  if (h >= 1 && h < 7) return "night";
  if (h === 23 || h === 0) return "late";
  return "day";
}

function forced(now: Date): [number, number] | null {
  if (typeof location === "undefined") return null;
  const v = new URLSearchParams(location.search).get("hour");
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  if (!Number.isFinite(h)) return null;
  return [((Math.floor(h) % 24) + 24) % 24, Number.isFinite(m) ? Math.min(59, Math.max(0, Math.floor(m))) : now.getMinutes()];
}

/** His time now. */
export function clock(now = new Date()): Clock {
  let hm = forced(now);
  if (!hm) {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE ?? undefined, hour: "numeric", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
      const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
      hm = [get("hour") % 24, get("minute")];
    } catch {
      hm = [now.getHours(), now.getMinutes()]; // an unknown zone: the visitor's own hours
    }
  }
  const [h, m] = hm;
  return { h, m, hours: hoursOf(h), text: `${h}:${String(m).padStart(2, "0")}` };
}

/**
 * Which night it is where he is: the date of the evening it began (his date twelve hours ago),
 * "2026-09-29", so an evening and the small hours after it are one night.
 */
export function nightOf(now = new Date()): string {
  const then = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE ?? undefined, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(then);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  } catch {
    return `${then.getFullYear()}-${String(then.getMonth() + 1).padStart(2, "0")}-${String(then.getDate()).padStart(2, "0")}`;
  }
}

const WOKEN = "eigengrau:woken";
/** The night it was last woken, as this page knows it (all it has in private mode). */
let wokenNight: string | null = null;

/** Whether this browser has already woken Urchi from its sleep tonight. */
export function wokenTonight(): boolean {
  let night = wokenNight;
  try {
    night = window.localStorage.getItem(WOKEN) ?? night;
  } catch {
    /* private mode: what this page knows */
  }
  return night === nightOf();
}

/** It was woken from its sleep just now: remembered for the rest of the night. */
export function markWoken(): void {
  wokenNight = nightOf();
  try {
    window.localStorage.setItem(WOKEN, wokenNight);
  } catch {
    /* private mode: kept in memory for this page */
  }
}
