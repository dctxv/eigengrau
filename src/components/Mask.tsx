import type { CSSProperties } from "react";

/** Each word in its own clip so it can rise in and slide out (spec 1, rule 6). */
export function MaskedWords({ text, className, style }: { text: string; className?: string; style?: CSSProperties }) {
  return (
    <span className={className} style={style} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span className="mask" key={i} aria-hidden="true">
          <span>{word}</span>
        </span>
      ))}
    </span>
  );
}

/** Each character in its own clip (monogram reveal). Spaces are kept as-is. */
export function MaskedChars({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span className="mask" key={i} aria-hidden="true">
          <span>{ch === " " ? " " : ch}</span>
        </span>
      ))}
    </span>
  );
}
