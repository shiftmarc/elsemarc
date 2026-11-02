import type { ElementName } from "./catalog";

/**
 * The shared interface every element (water, earth, air, fire) implements.
 *
 * The stage (stage.ts) owns everything common: the canvas, the frame clock
 * and pacing, pausing while the tab is hidden, the visitor's input
 * (presses anywhere, drags on the canvas, keystrokes in the form, a sent
 * message), knowing when the visitor is idle, and reduced motion. An
 * element only decides what all of that looks like.
 *
 * Coordinates are viewport (client) px; the element maps them to its canvas.
 */

/** Given to an element when it starts. */
export type ElementHooks = {
  /** The element can no longer run (e.g. its GPU context was lost): show the still version. */
  fail: () => void;
};

/** A running element. */
export interface ElementScene {
  /** Seconds without interaction before the idle ambience (e.g. water's rain) resumes. */
  readonly idleAfter: number;
  /** Advances and draws one frame. `time` is the stage's clock in seconds; `dt` the step. */
  frame(time: number, dt: number): void;
  /** Idle ambience, called before `frame` on every frame the visitor has been idle long enough. */
  ambience(time: number): void;
  /** A press anywhere on the page (the form included). */
  press(e: PointerEvent): void;
  /** A drag on the background itself: start, move, end (also on cancel or lost capture). */
  dragStart(e: PointerEvent): void;
  drag(e: PointerEvent): void;
  dragEnd(e: PointerEvent): void;
  /** A keystroke in a form field, at a spot just under the field. */
  keystroke(x: number, y: number): void;
  /**
   * The sent message, laid out in `text` (an invisible copy of the field).
   * Returns true if the element takes it (and animates it away), false to
   * let the form fade it instead.
   */
  sink(text: HTMLElement): boolean;
  /** Stops and frees everything; the canvas may be reused afterwards. */
  dispose(): void;
}

export interface ElementModule {
  readonly name: ElementName;
  /**
   * Starts on `canvas`, drawing `word` (the h1, whose own glyphs are hidden
   * while the element runs). Resolves to null if it can't run here; the
   * still version shows instead.
   */
  start(canvas: HTMLCanvasElement, word: HTMLElement, hooks: ElementHooks): Promise<ElementScene | null>;
  /**
   * The still version, for reduced motion or when `start` can't run. The
   * stage has already marked the page still (<html data-stage="off">), which
   * shows the plain h1; an element may add to that here. Returns a cleanup.
   */
  still(word: HTMLElement): () => void;
}
