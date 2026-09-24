"use client";

import { useEffect, useState, type Ref } from "react";
import { MONOGRAM, TABS } from "@/content/site";
import { Tab } from "./Tab";

type Props = { pathname: string; ref: Ref<HTMLElement> };

/** Fixed, centred as a group: logo slot, 14px gap, tabs 4px apart (spec 4.1). */
export function Nav({ pathname, ref }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const fonts = document.fonts;
    const done = () => alive && setReady(true);
    if (fonts?.load) {
      Promise.all([fonts.load('400 15px "Serif"'), fonts.load('500 11px "Grotesk"')]).then(done, done);
    } else {
      done();
    }
    return () => {
      alive = false;
    };
  }, []);

  return (
    <nav ref={ref} data-navbar className="nav" aria-label="Primary" data-ready={ready ? "" : undefined}>
      <div className="nav-inner">
        <span className="logo-slot" aria-hidden="true">
          {MONOGRAM}
        </span>
        <div className="tabs">
          {TABS.map((t) => (
            <Tab key={t.href} href={t.href} label={t.label} n={t.n} active={pathname === t.href} ready={ready} />
          ))}
        </div>
      </div>
    </nav>
  );
}
