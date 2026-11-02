"use client";

import { useEffect } from "react";

/**
 * Keeps the pool fitted to what's actually visible. When a phone keyboard
 * opens, iOS covers the page instead of resizing it (Android resizes it,
 * thanks to interactive-widget=resizes-content). Either way, the visual
 * viewport tells the truth, so this mirrors it into CSS:
 *
 *   --vv-h    visible height (px), --vv-top  how far it's panned down (px)
 *   html[data-keyboard]  when the visible height is well below its tallest
 *
 * Without JavaScript (or before it runs) the CSS falls back to 100dvh.
 */
export function VisibleViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    if (!vv) return;
    let tallest = { width: 0, height: 0 };
    let frame = 0;
    const update = () => {
      frame = 0;
      const width = Math.round(vv.width);
      const height = vv.height;
      if (width !== tallest.width) tallest = { width, height: 0 };
      tallest.height = Math.max(tallest.height, height);
      root.style.setProperty("--vv-h", `${height}px`);
      root.style.setProperty("--vv-top", `${vv.offsetTop}px`);
      if (height < tallest.height * 0.78) root.dataset.keyboard = "";
      else delete root.dataset.keyboard;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      root.style.removeProperty("--vv-h");
      root.style.removeProperty("--vv-top");
      delete root.dataset.keyboard;
    };
  }, []);
  return null;
}
