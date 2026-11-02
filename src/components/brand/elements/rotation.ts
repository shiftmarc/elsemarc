import { ELEMENT_ORDER, FIRST_ELEMENT, READY_ELEMENTS, VISIT } from "./catalog";

type VisitKeys = { elementKey: string; positionKey: string; activeKey: string };

/**
 * Which element this visit gets. A new visit starts after 30+ minutes
 * without activity on the site (see visit.ts); it moves on to the next
 * ready element in the order, wrapping around. Until then, every page load
 * (reloads, other tabs) keeps the visit's element.
 *
 * - All of it lives in localStorage: the element, its position in the
 *   order, and when the visitor was last active.
 * - A first-ever visit (no position stored, or an unreadable one) is water.
 * - If storage is unavailable (blocked, private modes that throw), water.
 * - ?element=name overrides it all for testing, without touching storage
 *   (also #element=name; case and stray characters are ignored).
 *
 * Runs before first paint as an inline script (see `elementBootScript`),
 * so it must stay self-contained: no imports or outside variables inside
 * the function body, and plain syntax only (it is inlined via toString).
 */
export function pickElement(order: readonly string[], ready: readonly string[], first: string, keys: VisitKeys, gapMs: number): string {
  try {
    // Forgiving, since it's often typed on a phone or pasted: any case of the
    // key, in the query or the hash, and only the letters of the value count
    // ("Earth", "earth.", "earth " and a pasted zero-width space all mean earth).
    let asked = "";
    for (const [key, value] of new URLSearchParams(location.search)) {
      if (key.toLowerCase() === "element") asked = value;
    }
    const inHash = /(?:^#|[#&])element=([^&]*)/i.exec(location.hash);
    if (!asked && inHash) asked = decodeURIComponent(inHash[1]);
    const name = asked.toLowerCase().replace(/[^a-z]/g, "");
    if (name && order.indexOf(name) >= 0) return name;
  } catch {
    // No URL to read: carry on with the rotation.
  }
  try {
    const now = Date.now();
    const last = parseInt(localStorage.getItem(keys.activeKey) || "", 10);
    const current = localStorage.getItem(keys.elementKey);
    // Same visit: active recently (a clock that went backwards counts as a new visit).
    if (current && ready.indexOf(current) >= 0 && now >= last && now - last < gapMs) {
      localStorage.setItem(keys.activeKey, String(now));
      return current;
    }
    const stored = localStorage.getItem(keys.positionKey);
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
    localStorage.setItem(keys.elementKey, next);
    localStorage.setItem(keys.positionKey, String(order.indexOf(next)));
    localStorage.setItem(keys.activeKey, String(now));
    return next;
  } catch {
    return first;
  }
}

/** The inline script's expression: the chosen element's name. */
export function elementBootScript() {
  const keys: VisitKeys = { elementKey: VISIT.elementKey, positionKey: VISIT.positionKey, activeKey: VISIT.activeKey };
  const args = [ELEMENT_ORDER, READY_ELEMENTS, FIRST_ELEMENT, keys, VISIT.gapMs].map((a) => JSON.stringify(a)).join(",");
  return `(${pickElement.toString()})(${args})`;
}
