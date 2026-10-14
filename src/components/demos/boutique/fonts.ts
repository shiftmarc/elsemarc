import { Figtree, Fraunces } from "next/font/google";

/**
 * Maison Argile's own typefaces, loaded on its demo route and its preview card.
 * Mapped to `font-argile-display` and `font-argile-sans` in globals.css.
 * Fraunces keeps its SOFT axis, which rounds its terminals like thrown clay.
 */
export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
});

export const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});
