/**
 * Lets the contact form hand its text to the water without importing the
 * engine: the form lays the text out in an invisible copy of its field and
 * announces it; the engine (if running) measures it and turns it into water.
 */

export const DISSOLVE_EVENT = "water:dissolve";

export type DissolveDetail = { element: HTMLElement; handled: boolean };

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
 * Turns what's typed in `field` into water where it sits. Returns false if
 * no water is running (reduced motion, no WebGL), so the caller can fade
 * the text out instead.
 */
export function dissolveIntoWater(field: HTMLTextAreaElement | HTMLInputElement): boolean {
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
  const detail: DissolveDetail = { element: mirror, handled: false };
  try {
    document.dispatchEvent(new CustomEvent(DISSOLVE_EVENT, { detail }));
  } finally {
    mirror.remove();
  }
  return detail.handled;
}
