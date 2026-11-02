import { KEYSTROKE_EVENT, SINK_EVENT, type KeystrokeDetail, type SinkDetail } from "./stage-events";
import type { ElementModule, ElementScene } from "./types";

/**
 * Runs one element on the full-screen canvas behind the page: the frame
 * clock, pausing while the tab is hidden, and the visitor's input, which it
 * hands to the element. It also tracks whether the visitor is idle, so the
 * element's ambience only plays while nobody is interacting.
 */

/** About 60 fps is plenty for the background; on 120 Hz screens, every other frame is skipped. */
const MIN_FRAME_INTERVAL = 1000 / 64;

export type StageCallbacks = { onReady: () => void; onFail: () => void };

export class Stage {
  private canvas: HTMLCanvasElement;
  private callbacks: StageCallbacks;
  private scene: ElementScene | null = null;

  private raf = 0;
  private last = 0;
  private lastDrawn = 0;
  private time = 0;
  private ready = false;
  private disposed = false;

  /** Pointers dragging on the canvas; while any is, the visitor counts as active. */
  private drags = new Set<number>();
  private lastActive = -Infinity;

  private constructor(canvas: HTMLCanvasElement, callbacks: StageCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
  }

  /** Starts `element`, or returns null (and the still version stays) if it can't run. */
  static async start(element: ElementModule, canvas: HTMLCanvasElement, word: HTMLElement, callbacks: StageCallbacks) {
    const stage = new Stage(canvas, callbacks);
    const scene = await element.start(canvas, word, { fail: stage.fail });
    if (!scene) return null;
    stage.scene = scene;
    stage.listen();
    return stage;
  }

  private listen() {
    const c = this.canvas;
    // Every press anywhere reaches the element; drags on the canvas itself are drags.
    window.addEventListener("pointerdown", this.onAnyDown, { capture: true, passive: true });
    c.addEventListener("pointerdown", this.onDown);
    c.addEventListener("pointermove", this.onMove);
    c.addEventListener("pointerup", this.onEnd);
    c.addEventListener("pointercancel", this.onEnd);
    c.addEventListener("lostpointercapture", this.onEnd);
    document.addEventListener("visibilitychange", this.updateRunning);
    document.addEventListener(KEYSTROKE_EVENT, this.onKeystroke);
    document.addEventListener(SINK_EVENT, this.onSink);
    this.updateRunning();
  }

  /** The visitor is doing something: hold the ambience off. */
  private active() {
    this.lastActive = this.time;
  }

  private onAnyDown = (e: PointerEvent) => {
    this.active();
    this.scene?.press(e);
  };

  private onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nicety: drags still work while the pointer stays on the canvas.
    }
    this.drags.add(e.pointerId);
    this.scene?.dragStart(e);
    this.active();
  };

  private onMove = (e: PointerEvent) => {
    if (this.drags.has(e.pointerId)) this.scene?.drag(e);
  };

  private onEnd = (e: PointerEvent) => {
    this.drags.delete(e.pointerId);
    this.scene?.dragEnd(e);
  };

  private onKeystroke = (e: Event) => {
    this.active();
    const detail = (e as CustomEvent<KeystrokeDetail>).detail;
    if (detail) this.scene?.keystroke(detail.x, detail.y);
  };

  private onSink = (e: Event) => {
    const detail = (e as CustomEvent<SinkDetail>).detail;
    if (!detail?.element || this.disposed || !this.ready || !this.scene) return;
    if (!this.scene.sink(detail.element)) return;
    this.active();
    detail.handled = true;
  };

  private updateRunning = () => {
    const run = !document.hidden && !this.disposed;
    if (run && !this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    } else if (!run && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  };

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    if (now - this.lastDrawn < MIN_FRAME_INTERVAL && this.ready) return;
    this.lastDrawn = now;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;

    const scene = this.scene!;
    if (this.drags.size > 0) this.active();
    if (this.time - this.lastActive >= scene.idleAfter) scene.ambience(this.time);
    scene.frame(this.time, dt);

    if (!this.ready) {
      this.ready = true;
      this.callbacks.onReady();
    }
  };

  private fail = () => {
    if (this.disposed) return;
    this.dispose();
    this.callbacks.onFail();
  };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    window.removeEventListener("pointerdown", this.onAnyDown, { capture: true });
    document.removeEventListener("visibilitychange", this.updateRunning);
    document.removeEventListener(KEYSTROKE_EVENT, this.onKeystroke);
    document.removeEventListener(SINK_EVENT, this.onSink);
    const c = this.canvas;
    c.removeEventListener("pointerdown", this.onDown);
    c.removeEventListener("pointermove", this.onMove);
    c.removeEventListener("pointerup", this.onEnd);
    c.removeEventListener("pointercancel", this.onEnd);
    c.removeEventListener("lostpointercapture", this.onEnd);
    this.scene?.dispose();
    this.scene = null;
  }
}
