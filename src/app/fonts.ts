import { Inter_Tight, Newsreader } from "next/font/google";

// Grotesk: all UI and headings.
export const grotesk = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

// Serif: second half of a pairing, numerals, dates, the delta.
// Pinned to the one weight in use. The variable build with the opsz axis is
// ~140 KB per style and, preloaded, pushes mobile LCP past the budget; the
// static 400 instances are ~24 KB each (opsz sits at the font's default, 16).
export const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});
