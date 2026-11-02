"use client";

import { useEffect, useRef } from "react";
import { ELEMENT_MODULES, resolveElement } from "./registry";
import { Stage } from "./stage";

/**
 * The background: a full-screen canvas behind the page where this visit's
 * element (water, for now always) runs, with the h1's letters drawn into
 * it. It only ever adds the animation: the h1 stays the real, readable
 * heading, and its text shows whenever the element can't run (no WebGL2,
 * reduced motion, or an error).
 *
 * State lives on <html>:
 * - data-element: which element this visit gets, chosen before first paint
 *   by the root layout's inline script (see rotation.ts). If it names an
 *   element without code yet, this resets it to water.
 * - data-stage: "pending" (set before paint, if the element is likely to
 *   run), "on" once it is drawing, "off" for the still version.
 */
export function ElementStage() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const word = document.querySelector<HTMLElement>("h1[data-element-word]");
    if (!canvas || !word) return;
    const root = document.documentElement;
    const name = resolveElement(root.dataset.element);
    root.dataset.element = name;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let stage: Stage | null = null;
    let still: (() => void) | null = null;
    let generation = 0;

    const stop = () => {
      stage?.dispose();
      stage = null;
      still?.();
      still = null;
    };

    const run = async () => {
      const mine = ++generation;
      stop();
      let element;
      try {
        element = await ELEMENT_MODULES[name]!.load();
      } catch (error) {
        console.warn(`[stage] Could not load ${name}`, error);
        if (mine === generation) root.dataset.stage = "off";
        return;
      }
      if (mine !== generation) return;
      const showStill = () => {
        root.dataset.stage = "off";
        still = element.still(word);
      };
      if (reduced.matches) {
        showStill();
        return;
      }
      const started = await Stage.start(element, canvas, word, {
        onReady: () => {
          if (mine === generation) root.dataset.stage = "on";
        },
        onFail: () => {
          if (mine === generation) showStill();
        },
      });
      if (mine !== generation) {
        started?.dispose();
        return;
      }
      if (!started) showStill();
      stage = started;
    };

    run();
    reduced.addEventListener("change", run);
    return () => {
      generation++;
      reduced.removeEventListener("change", run);
      stop();
      root.dataset.stage = "off";
    };
  }, []);

  return (
    <>
      {Object.entries(ELEMENT_MODULES).map(([key, entry]) => entry.Overlay && <entry.Overlay key={key} />)}
      <canvas ref={ref} aria-hidden="true" className="element-canvas absolute inset-0 size-full touch-none select-none" />
    </>
  );
}
