/**
 * How the page talks to the pool without importing it: plain DOM events.
 * If no pool is running (reduced motion, no WebGL), nobody answers, and
 * the callers fall back to doing nothing (ripples) or a fade (sinking).
 */

export const RIPPLE_EVENT = "pool:ripple";
export const SINK_EVENT = "pool:sink";

export type RippleDetail = { x: number; y: number; kind: "key" };
export type SinkDetail = { element: HTMLElement; handled: boolean };

/** A small ripple just under a field, somewhere along it: for a keystroke. */
export function rippleUnder(field: HTMLElement) {
  const rect = field.getBoundingClientRect();
  const detail: RippleDetail = {
    x: rect.left + rect.width * (0.25 + Math.random() * 0.5),
    y: rect.bottom - 2,
    kind: "key",
  };
  document.dispatchEvent(new CustomEvent(RIPPLE_EVENT, { detail }));
}

const COPIED = [
  "boxSizing",
  "width",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "fontVariationSettings",
  "fontOpticalSizing",
  "letterSpacing",
  "lineHeight",
  "textAlign",
  "textIndent",
  "textTransform",
  "wordSpacing",
  "tabSize",
] as const;

/**
 * Lets what's typed in `field` sink to the pool floor from where it sits.
 * The text is laid out in an invisible copy of the field so the pool can
 * measure every letter. Returns false if no pool is running, so the caller
 * can fade the text out instead.
 */
export function sinkIntoPool(field: HTMLTextAreaElement | HTMLInputElement): boolean {
  const text = field.value;
  if (!text.trim()) return false;
  const style = getComputedStyle(field);
  const rect = field.getBoundingClientRect();
  const mirror = document.createElement("div");
  for (const key of COPIED) mirror.style[key] = style[key];
  Object.assign(mirror.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top - field.scrollTop}px`,
    borderStyle: "solid",
    borderColor: "transparent",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    visibility: "hidden",
    pointerEvents: "none",
  });
  mirror.textContent = text;
  document.body.append(mirror);
  const detail: SinkDetail = { element: mirror, handled: false };
  try {
    document.dispatchEvent(new CustomEvent(SINK_EVENT, { detail }));
  } finally {
    mirror.remove();
  }
  return detail.handled;
}
