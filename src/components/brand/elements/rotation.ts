import { ELEMENT_ORDER, FIRST_ELEMENT, READY_ELEMENTS } from "./catalog";

/**
 * Which element this visit gets. Each new visit (a new browser session:
 * sessionStorage is empty) moves on to the next ready element in the
 * order, wrapping around; reloads within a session keep the same one.
 *
 * - The position in the order is kept in localStorage.
 * - A first-ever visit (no position stored, or an unreadable one) is water.
 * - If storage is unavailable (blocked, private modes that throw), water.
 * - ?element=name overrides it all for testing, without touching storage.
 *
 * Runs before first paint as an inline script (see `elementBootScript`),
 * so it must stay self-contained: no imports or outside variables inside
 * the function body, and plain syntax only (it is inlined via toString).
 */
export function pickElement(order: readonly string[], ready: readonly string[], first: string): string {
  try {
    const asked = new URLSearchParams(location.search).get("element");
    if (asked && order.indexOf(asked) >= 0) return asked;
  } catch {
    // No URL to read: carry on with the rotation.
  }
  try {
    const visitKey = "elsemarc:element";
    const positionKey = "elsemarc:element-position";
    const current = sessionStorage.getItem(visitKey);
    if (current && ready.indexOf(current) >= 0) return current;
    const stored = localStorage.getItem(positionKey);
    const position = stored === null ? -1 : parseInt(stored, 10);
    let next = first;
    if (position >= 0 && position < order.length) {
      for (let step = 1; step <= order.length; step++) {
        const candidate = order[(position + step) % order.length];
        if (ready.indexOf(candidate) >= 0) {
          next = candidate;
          break;
        }
      }
    }
    if (ready.indexOf(next) < 0) next = first;
    sessionStorage.setItem(visitKey, next);
    localStorage.setItem(positionKey, String(order.indexOf(next)));
    return next;
  } catch {
    return first;
  }
}

/** The inline script's expression: the chosen element's name. */
export function elementBootScript() {
  return `(${pickElement.toString()})(${JSON.stringify(ELEMENT_ORDER)},${JSON.stringify(READY_ELEMENTS)},${JSON.stringify(FIRST_ELEMENT)})`;
}
