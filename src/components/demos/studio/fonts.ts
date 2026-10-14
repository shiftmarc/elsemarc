import { Archivo, Geist_Mono } from "next/font/google";

/**
 * Field Office's own typefaces, loaded on its demo route and its preview card.
 * Mapped to `font-field-sans` and `font-field-mono` in globals.css.
 * Archivo keeps its width axis so captions can run condensed and the
 * wordmark can run wide.
 */
export const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
