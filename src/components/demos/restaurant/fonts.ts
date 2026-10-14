import { Cormorant, Jost } from "next/font/google";

/**
 * Ardoise's own typefaces, loaded on its demo route and its preview card.
 * Mapped to `font-ardoise-display` and `font-ardoise-sans` in globals.css.
 */
export const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});
