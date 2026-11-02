import { VISIT } from "./catalog";

/**
 * Keeps the current visit alive while the visitor is active: notes the
 * time in localStorage (at most every 15 s) on any input, scrolling, or
 * coming back to the tab. After 30+ minutes without any, the next page
 * load starts a new visit with the next element (rotation.ts).
 *
 * Just having the page open doesn't count. Returns a cleanup.
 */
const EVENTS = ["pointerdown", "pointermove", "keydown", "input", "wheel", "scroll", "touchstart"] as const;

export function keepVisitAlive() {
  let written = 0;
  const touch = () => {
    const now = Date.now();
    if (now - written < VISIT.writeEveryMs) return;
    written = now;
    try {
      localStorage.setItem(VISIT.activeKey, String(now));
    } catch {
      // No storage: every visit is water anyway.
    }
  };
  const onVisible = () => {
    if (!document.hidden) touch();
  };
  for (const name of EVENTS) window.addEventListener(name, touch, { capture: true, passive: true });
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    for (const name of EVENTS) window.removeEventListener(name, touch, { capture: true });
    document.removeEventListener("visibilitychange", onVisible);
  };
}
