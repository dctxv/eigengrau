import { TIME_ZONE } from "@/content/site";

/**
 * Urchi keeps his hours: the time where Darius is (TIME_ZONE, or the
 * visitor's own zone until he sets one), and what that makes the hour.
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
