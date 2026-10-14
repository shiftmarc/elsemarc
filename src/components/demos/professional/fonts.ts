import { Hanken_Grotesk, Source_Serif_4 } from "next/font/google";

/**
 * Halden Advisory's own typefaces, loaded on its demo route and its preview card.
 * Mapped to `font-halden-sans` and `font-halden-serif` in globals.css.
 * Hanken Grotesk carries the page; Source Serif 4 is kept for the few
 * places that should read like a considered letter: notes, quotes, figures.
 */
export const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

export const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});
