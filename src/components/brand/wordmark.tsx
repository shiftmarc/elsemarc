import { siteConfig } from "@/config/site";

/**
 * The wordmark: the page's real h1. The water tank (WaterCanvas) measures
 * this exact text and draws it in water; while it does, the glyphs here are
 * made transparent (see "Water tank" in globals.css). With reduced motion,
 * no WebGL2, or before the script runs, this is the still version.
 *
 * Pointer events pass through to the water behind it.
 */
export function Wordmark() {
  return (
    <h1
      data-water-word=""
      className="wordmark type-display pointer-events-none text-center text-[clamp(2rem,0.25rem+8.5vw,8.5rem)] leading-[0.85] tracking-[-0.045em] select-none"
    >
      {siteConfig.name}
      <span aria-hidden="true" data-water-accent="" className="text-accent">
        .
      </span>
    </h1>
  );
}
