import { siteConfig } from "@/config/site";
import { WaterCanvas } from "./water/water-canvas";

/**
 * The hero wordmark: the real h1, with the water simulation drawn over it.
 *
 * The h1 keeps its text for screen readers, search and copy. While the
 * water runs, its glyphs are made transparent (see "Water wordmark" in
 * globals.css) and the canvas draws the word in liquid instead, measured
 * from this exact text. With reduced motion, no WebGL2, or before the
 * script runs, the h1 is the still version.
 *
 * Render inside a positioned box: the canvas fills it, and its bottom
 * edge is the floor the water pools on.
 */
export function Wordmark() {
  return (
    <>
      <h1 data-water-word="" className="wordmark type-display text-center text-[clamp(4rem,0.5rem+17vw,17rem)] leading-[0.85] tracking-[-0.045em]">
        {siteConfig.name}
        <span aria-hidden="true" data-water-accent="" className="text-accent">
          .
        </span>
      </h1>
      <WaterCanvas />
    </>
  );
}
