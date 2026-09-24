import { TABS, type TabHref } from "@/content/site";

export const TAB_ORDER: readonly string[] = TABS.map((t) => t.href);

export function isTab(path: string): path is TabHref {
  return TAB_ORDER.includes(path);
}

export function tabIndex(path: string): number {
  return TAB_ORDER.indexOf(path);
}
