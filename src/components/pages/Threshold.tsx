"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import gsap from "gsap";
import { BOARDS_PER_ROUND, ROUNDS, boardsFor, resultAfterMiss, squareColor } from "@/lib/threshold";

type Props = {
  /** YYYY-MM-DD in UTC: the day's boards are seeded from it. */
  date: string;
  /** How far below the viewport's centre the plate sits, so Urchi fits above it. */
  drop: number;
  reducedMotion: boolean;
  onCorrect(): void;
  onMiss(): void;
  /** The run is over, with the last step passed (0 when none). The board leaves next. */
  onEnd(result: number): void;
  /** The board has left, after a run or a close. */
  onClosed(abandoned: boolean): void;
  /** The pointer over the door, and whether it is on the plate. */
  onPointer(clientX: number, clientY: number, onPlate: boolean): void;
  onLeave(): void;
};

const PLATE_IN = 0.5;
const PLATE_OUT = 0.4;
const BOARD_IN = 0.5;

/**
 * Threshold, the daily game: a just-noticeable-difference test on the page's
 * own ground. The plate is opaque eigengrau so nothing shows through the
 * gaps; every square is a button, and only the one lighter square has a
 * colour of its own. Plain DOM beside the aria-hidden stage, so the keyboard
 * and assistive tech reach it. No timer, no score, nothing in the chrome.
 */
export function Threshold(props: Props) {
  const boards = useMemo(() => boardsFor(props.date), [props.date]);
  const [index, setIndex] = useState(0);
  const plate = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const over = useRef(false);

  const board = boards[index];
  const count = board.grid * board.grid;

  const leave = (abandoned: boolean) => {
    if (over.current) return;
    over.current = true;
    const done = () => props.onClosed(abandoned);
    if (props.reducedMotion) {
      done();
      return;
    }
    gsap.to(plate.current, { opacity: 0, duration: PLATE_OUT, ease: "power2.out", overwrite: true, onComplete: done });
  };
  const onEscape = useEffectEvent(() => leave(true));

  const end = (result: number) => {
    props.onEnd(result);
    leave(false);
  };

  const pick = (i: number) => {
    if (over.current) return;
    if (i !== board.target) {
      props.onMiss();
      end(resultAfterMiss(index));
      return;
    }
    props.onCorrect();
    if (index + 1 < boards.length) setIndex(index + 1);
    else end(ROUNDS[ROUNDS.length - 1].step); // every board found: the finest step there is
  };

  // The plate fades in once; each board fades in as one, so no square's entrance gives the lighter one away,
  // and the plate keeps focus so Tab lands on the first square.
  const { reducedMotion } = props;
  useLayoutEffect(() => {
    const el = plate.current!;
    if (reducedMotion) {
      gsap.set(el, { opacity: 1 });
      return;
    }
    const t = gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: PLATE_IN, ease: "power2.out" });
    return () => {
      t.kill();
    };
  }, [reducedMotion]);
  useLayoutEffect(() => {
    plate.current!.focus({ preventScroll: true });
    if (reducedMotion) return;
    const t = gsap.fromTo(grid.current, { opacity: 0 }, { opacity: 1, duration: BOARD_IN, ease: "power2.out", delay: index === 0 ? 0.2 : 0 });
    return () => {
      t.kill();
    };
  }, [index, reducedMotion]);

  // Escape closes, caught in the capture phase so nothing else on the page acts on it first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onEscape();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const onPlate = (target: EventTarget | null) => !!plate.current && plate.current.contains(target as Node);
  const onClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!onPlate(e.target)) leave(true);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => props.onPointer(e.clientX, e.clientY, onPlate(e.target));

  return (
    <div className="threshold" onClick={onClick} onPointerMove={onMove} onPointerLeave={() => props.onLeave()}>
      <div
        ref={plate}
        className="threshold-plate"
        style={{ "--threshold-drop": `${props.drop}px` } as CSSProperties}
        role="group"
        tabIndex={-1}
        aria-label={`Threshold, round ${board.round + 1} of ${ROUNDS.length}, board ${(index % BOARDS_PER_ROUND) + 1} of ${BOARDS_PER_ROUND}. Find the lighter square.`}
      >
        <div ref={grid} className="threshold-grid" style={{ gridTemplateColumns: `repeat(${board.grid}, 1fr)`, gridTemplateRows: `repeat(${board.grid}, 1fr)` }}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={`${index}-${i}`}
              type="button"
              aria-label={`square ${i + 1} of ${count}`}
              style={i === board.target ? { background: squareColor(board.step) } : undefined}
              onClick={() => pick(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
