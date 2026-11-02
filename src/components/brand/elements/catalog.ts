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

/**
 * What counts as a visit: one ends after `gapMs` without activity on the
 * site (any open tab). Kept in localStorage under these keys.
 */
export const VISIT = {
  /** This visit's element. */
  elementKey: "elsemarc:element",
  /** Its index in ELEMENT_ORDER, where the next visit's search starts. */
  positionKey: "elsemarc:element-position",
  /** When the visitor was last active on the site (ms since the epoch). */
  activeKey: "elsemarc:last-active",
  gapMs: 30 * 60 * 1000,
  /** Activity is written at most this often. */
  writeEveryMs: 15 * 1000,
};

export const isElementName =(value: unknown): value is ElementName =>
  typeof value === "string" && (ELEMENT_ORDER as readonly string[]).includes(value);
