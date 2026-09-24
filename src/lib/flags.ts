/**
 * Global runtime flags, mirrored from the reference's app state. One tiny
 * store so the chrome, the pages and the intro can talk without prop drilling.
 */
export type Flags = {
  loadingComplete: boolean;
  pageReady: boolean;
  exploded: boolean;
  cameFromInAppNav: boolean;
  preloadProgress: number;
  soundEnabled: boolean;
  transitioning: boolean;
};

type Listener = (flags: Flags) => void;

const flags: Flags = {
  loadingComplete: false,
  pageReady: false,
  exploded: false,
  cameFromInAppNav: false,
  preloadProgress: 0,
  soundEnabled: false,
  transitioning: false,
};

const listeners = new Set<Listener>();

export function getFlags(): Readonly<Flags> {
  return flags;
}

export function setFlag<K extends keyof Flags>(key: K, value: Flags[K]) {
  if (flags[key] === value) return;
  flags[key] = value;
  listeners.forEach((l) => l(flags));
}

export function onFlags(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
