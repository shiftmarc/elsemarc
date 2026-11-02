/**
 * How the page talks to the background element without importing it:
 * plain DOM events, answered by the stage (stage.ts). If no element is
 * running (reduced motion, no WebGL), nobody answers, and the callers fall
 * back to doing nothing (keystrokes) or a fade (sinking).
 */

export const KEYSTROKE_EVENT = "stage:keystroke";
export const SINK_EVENT = "stage:sink";

export type KeystrokeDetail = { x: number; y: number };
export type SinkDetail = { element: HTMLElement; handled: boolean };

/** A keystroke in `field`: reported at a spot just under it, somewhere along it (water ripples there). */
export function keystrokeUnder(field: HTMLElement) {
  const rect = field.getBoundingClientRect();
  const detail: KeystrokeDetail = {
    x: rect.left + rect.width * (0.25 + Math.random() * 0.5),
    y: rect.bottom - 2,
  };
  document.dispatchEvent(new CustomEvent(KEYSTROKE_EVENT, { detail }));
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
 * Hands what's typed in `field` to the element from where it sits (water
 * sinks it to the pool floor). The text is laid out in an invisible copy of
 * the field so the element can measure every letter. Returns false if no
 * element took it, so the caller can fade the text out instead.
 */
export function sinkMessage(field: HTMLTextAreaElement | HTMLInputElement): boolean {
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
