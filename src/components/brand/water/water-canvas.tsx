"use client";

import { useEffect, useRef } from "react";
import { PoolEngine } from "./engine";

/**
 * The pool: a full-screen canvas of water behind the page, with the h1's
 * letters lying on its floor. It only ever adds the animation: the h1
 * stays the real, readable heading, and its text shows whenever the pool
 * can't run (no WebGL2 or float targets, reduced motion, or an error).
 *
 * State lives on <html data-water>: "pending" (set before paint by the
 * inline script in the root layout), "on" once the pool is drawing,
 * "off" for the still version.
 */
export function WaterCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const h1 = document.querySelector<HTMLElement>("h1[data-water-word]");
    if (!canvas || !h1) return;
    const root = document.documentElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let engine: PoolEngine | null = null;
    let generation = 0;

    const run = async () => {
      const mine = ++generation;
      engine?.dispose();
      engine = null;
      if (reduced.matches) {
        root.dataset.water = "off";
        return;
      }
      const started = await PoolEngine.start(canvas, h1, {
        onReady: () => {
          if (mine === generation) root.dataset.water = "on";
        },
        onFail: () => {
          if (mine === generation) root.dataset.water = "off";
        },
      });
      if (mine !== generation) {
        started?.dispose();
        return;
      }
      if (!started) root.dataset.water = "off";
      engine = started;
    };

    run();
    reduced.addEventListener("change", run);
    return () => {
      generation++;
      reduced.removeEventListener("change", run);
      engine?.dispose();
      root.dataset.water = "off";
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="water-canvas absolute inset-0 size-full touch-none select-none" />;
}
