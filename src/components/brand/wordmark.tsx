import { siteConfig } from "@/config/site";

/**
 * The wordmark: the page's real h1. The pool (WaterCanvas) measures this
 * exact text and lays it on the pool floor, under the moving water; while
 * it does, the glyphs here are made transparent (see "The pool" in
 * globals.css). With reduced motion, no WebGL2, or before the script runs,
 * this is the still version.
 *
 * Large, but sized to the visible height too, so the form below still fits
 * with a phone keyboard open. Pointer events pass through to the water.
 */
export function Wordmark() {
  return (
    <h1
      data-water-word=""
      className="wordmark type-display pointer-events-none shrink-0 text-center leading-[0.85] tracking-[-0.045em] select-none"
    >
      {siteConfig.name}
      <span aria-hidden="true" data-water-accent="" className="text-accent">
        .
      </span>
    </h1>
  );
}
