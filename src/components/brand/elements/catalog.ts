/**
 * The elements the background can be, in visit-rotation order. Plain data,
 * safe to import anywhere (the root layout reads it on the server to pick
 * the element before first paint; the stage loads the chosen one's code).
 *
 * `ready` puts an element into the rotation. An element that isn't ready
 * can still be opened with ?element=name, once it has a module in
 * registry.ts; until then that falls back to water.
 */

export const ELEMENT_ORDER = ["water", "earth", "air", "fire"] as const;

export type ElementName = (typeof ELEMENT_ORDER)[number];

/** Every first-ever visit, and every visit where storage isn't available, is water. */
export const FIRST_ELEMENT: ElementName = "water";

export const READY: Record<ElementName, boolean> = {
  water: true,
  earth: false,
  air: false,
  fire: false,
};

export const READY_ELEMENTS: ElementName[] = ELEMENT_ORDER.filter((name) => READY[name]);

export const isElementName = (value: unknown): value is ElementName =>
  typeof value === "string" && (ELEMENT_ORDER as readonly string[]).includes(value);
