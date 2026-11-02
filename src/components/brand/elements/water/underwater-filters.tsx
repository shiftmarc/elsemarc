"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * SVG filters that make the page's text look like it's seen through the
 * pool: a slow, gentle waver (the slight softening is a text-shadow in
 * globals.css, which costs nothing while the text is still). Applied from
 * globals.css ("Underwater text"), only while water is the running
 * element and motion is welcome. Rendered as water's overlay (registry.ts).
 *
 * - #underwater: labels, questions, buttons, the line under the wordmark,
 *   the corner email.
 * - #underwater-field: inputs, weaker, so typing stays easy to read and the
 *   caret stays put.
 *
 * The waver is a displacement map driven by a smooth noise image that
 * slowly slides past. Both choices keep it cheap on phones: the noise is
 * drawn once (feTurbulence would be regenerated every frame), and the
 * slide is stepped 12 times a second rather than every frame, since the
 * filtered text is re-rendered on each step. The motion is so slow that
 * each step moves the text by a fraction of a pixel.
 */

// The noise image's size on screen (CSS px): wide and tall enough to cover
// any filtered element while it slides by up to SLIDE_X and SLIDE_Y.
const IMAGE_W = 1800;
const IMAGE_H = 320;
const SLIDE_X = 900;
const SLIDE_Y = 60;

/** Smooth value noise in R and G (x and y displacement), as a PNG data URL. */
function drawNoise() {
  const w = 384;
  const h = 68;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const lattice = (seed: number) => {
    const cols = 40;
    const rows = 24;
    const values = new Float32Array(cols * rows);
    let s = seed;
    for (let i = 0; i < values.length; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      values[i] = s / 4294967296;
    }
    return (x: number, y: number) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const fx = x - xi;
      const fy = y - yi;
      const ux = fx * fx * (3 - 2 * fx);
      const uy = fy * fy * (3 - 2 * fy);
      const at = (cx: number, cy: number) => values[(((cy % rows) + rows) % rows) * cols + (((cx % cols) + cols) % cols)];
      const top = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * ux;
      const bottom = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * ux;
      return top + (bottom - top) * uy;
    };
  };
  const nx = lattice(7);
  const ny = lattice(23);
  const image = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Wide, flat features (about 80 by 20 CSS px once stretched): a gentle sway, not a ripple.
      const i = (y * w + x) * 4;
      image.data[i] = Math.round(255 * nx(x / 17, y / 4.3));
      image.data[i + 1] = Math.round(255 * ny(x / 17, y / 4.3));
      image.data[i + 2] = 128;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

const STEPS_PER_SECOND = 12;

/** The sliding noise; until its image is set, a flat mid-grey (which displaces nothing) shows through. */
function Noise({ imageRef }: { imageRef: RefObject<SVGFEImageElement | null> }) {
  return (
    <>
      <feFlood floodColor="rgb(128,128,128)" result="flat" />
      <feImage ref={imageRef} x={0} y={0} width={IMAGE_W} height={IMAGE_H} preserveAspectRatio="none" result="image" />
      <feComposite in="image" in2="flat" operator="over" result="noise" />
    </>
  );
}

/** Each filter's slide: periods (s) along x and y, and a starting offset so the two differ. */
const SLIDES = [
  { period: [26, 17], phase: 0 },
  { period: [34, 23], phase: 300 },
] as const;

/** Eases back and forth between 0 and 1 over `period` seconds. */
const swing = (t: number, period: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / period);

export function UnderwaterFilters() {
  const text = useRef<SVGFEImageElement>(null);
  const field = useRef<SVGFEImageElement>(null);
  // Drawn after mount (it needs a canvas); the filters only apply once the pool is running anyway.
  useEffect(() => {
    const href = drawNoise();
    const images = [text.current, field.current];
    if (!href || images.some((image) => !image)) return;
    for (const image of images) image!.setAttribute("href", href);
    const root = document.documentElement;
    const step = () => {
      // Nothing to move while the filters aren't in use (another element, no pool, reduced motion, hidden tab).
      if (root.dataset.stage !== "on" || root.dataset.element !== "water" || document.hidden) return;
      const t = performance.now() / 1000;
      images.forEach((image, i) => {
        const { period, phase } = SLIDES[i];
        image!.setAttribute("x", (-phase - SLIDE_X * swing(t, period[0])).toFixed(1));
        image!.setAttribute("y", (-SLIDE_Y * swing(t, period[1])).toFixed(1));
      });
    };
    step();
    const timer = window.setInterval(step, 1000 / STEPS_PER_SECOND);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="pointer-events-none absolute overflow-hidden">
      <defs>
        <filter id="underwater" x="-4%" y="-30%" width="108%" height="160%" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <Noise imageRef={text} />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={3.2} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="underwater-field" x="-2%" y="-20%" width="104%" height="140%" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <Noise imageRef={field} />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={1.5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
