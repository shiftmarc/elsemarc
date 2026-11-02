import type { ComponentType } from "react";
import { FIRST_ELEMENT, type ElementName } from "./catalog";
import type { ElementModule } from "./types";
import { UnderwaterFilters } from "./water/underwater-filters";

/**
 * The elements that have code, and how to load it. Each element's module
 * is its own chunk, fetched only on visits that get that element.
 *
 * `Overlay` is optional page-level markup an element needs (water's SVG
 * filters for its underwater text). Overlays are always rendered, since
 * the element is only known in the browser; each one stays inert unless
 * <html data-element> names its element.
 *
 * To add an element: give it a folder with an index exporting an
 * ElementModule, add it here, and mark it ready in catalog.ts once it
 * should join the rotation.
 */
type Entry = { load: () => Promise<ElementModule>; Overlay?: ComponentType };

export const ELEMENT_MODULES: Partial<Record<ElementName, Entry>> = {
  water: { load: () => import("./water").then((m) => m.water), Overlay: UnderwaterFilters },
};

/** The element to run for `name` (from <html data-element>): itself if it has code, else water. */
export function resolveElement(name: string | undefined): ElementName {
  const known = name && Object.hasOwn(ELEMENT_MODULES, name) ? (name as ElementName) : null;
  return known ?? FIRST_ELEMENT;
}
