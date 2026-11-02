import { RIPPLE_EVENT, SINK_EVENT, type RippleDetail, type SinkDetail } from "./pool-events";
import { PoolRenderer, type Drop, type EdgeWave, type MessageState } from "./renderer";
import { boundsOf, drawText, loadFont, measureWord } from "./text-layout";
import { TUNING } from "./tuning";

/**
 * Runs the pool on a full-screen canvas behind the page: sizing, the frame
 * loop, ripples from clicks, touches, drags and keystrokes, tilt waves, the
 * sinking message, pausing when hidden, and drawing fewer pixels on slow
 * devices. The h1 stays the real heading; the pool draws the same letters
 * on its floor, wherever the h1 currently is.
 */

/** Any CSS colour → 0–1 RGB (sRGB, as the page blends). */
function readColor(value: string, fallback: number[]): number[] {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx || !value) return fallback;
  ctx.fillStyle = "#000";
  ctx.fillStyle = value.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(ctx.fillStyle);
  if (!hex) return fallback;
  const n = parseInt(hex[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

type Drag = { x: number; y: number; t: number; carry: number };

export type PoolCallbacks = { onReady: () => void; onFail: () => void };

export class PoolEngine {
  private canvas: HTMLCanvasElement;
  private h1: HTMLElement;
  private callbacks: PoolCallbacks;
  private gl: WebGL2RenderingContext;
  private renderer: PoolRenderer;

  private pixelRatio: number;
  private size: [number, number] = [0, 0];
  private origin: [number, number] = [0, 0];
  /** Where the h1 was (canvas px) when the floor was drawn; it may have moved since. */
  private drawnAt: [number, number] = [0, 0];

  private raf = 0;
  private last = 0;
  private lastDrawn = 0;
  private acc = 0;
  private time = 0;
  private frameMs = 16.7;
  private slowSince = -1;
  private ready = false;
  private disposed = false;
  private resizeTimer = 0;

  private drops: Drop[] = [];
  private wave: EdgeWave | null = null;
  private drags = new Map<number, Drag>();

  private message: { start: number; cx: number; cy: number } | null = null;

  // Tilt: the latest reading, and the slowly-following "level" it is compared with.
  private gravity: [number, number] | null = null;
  private level: [number, number] | null = null;
  private nextWave = 0;

  private resizer: ResizeObserver;

  private constructor(canvas: HTMLCanvasElement, h1: HTMLElement, gl: WebGL2RenderingContext, callbacks: PoolCallbacks) {
    this.canvas = canvas;
    this.h1 = h1;
    this.gl = gl;
    this.callbacks = callbacks;
    this.renderer = new PoolRenderer(gl);
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, TUNING.render.maxPixelRatio);

    const root = getComputedStyle(document.documentElement);
    this.renderer.setColors({
      base: readColor(root.getPropertyValue("--surface"), [0.094, 0.094, 0.086]),
      color: readColor(root.getPropertyValue("--fg"), [0.957, 0.945, 0.918]),
      accent: readColor(root.getPropertyValue("--accent"), [0.894, 0.314, 0.169]),
    });

    this.resizer = new ResizeObserver(() => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.layout(), 120);
    });
  }

  /** Starts the pool, or returns null (and the still h1 stays) if it can't run. */
  static async start(canvas: HTMLCanvasElement, h1: HTMLElement, callbacks: PoolCallbacks): Promise<PoolEngine | null> {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "default",
    });
    if (!gl) return null;
    let engine: PoolEngine;
    try {
      engine = new PoolEngine(canvas, h1, gl, callbacks);
    } catch (error) {
      console.warn("[pool] WebGL setup failed", error);
      return null;
    }
    await loadFont(h1);
    if (engine.disposed) return engine;
    try {
      if (!engine.layout()) {
        engine.dispose();
        return null;
      }
    } catch (error) {
      console.warn("[pool] Could not start", error);
      engine.dispose();
      return null;
    }
    engine.listen();
    return engine;
  }

  /** Sizes everything to the canvas and redraws the floor from the h1. */
  private layout() {
    if (this.disposed) return false;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width < 2 || height < 2) return false;
    const budget = Math.sqrt(TUNING.render.pixelBudget / (width * height));
    const ratio = Math.max(1, Math.min(this.pixelRatio, budget));
    this.size = [width, height];
    this.renderer.resize(width, height, ratio);
    const word = measureWord(this.h1, this.canvas);
    if (word.glyphs.length === 0) return false;
    this.renderer.setFloor(drawText([word], width, height, ratio, "floor"));
    this.drawnAt = this.h1Position();
    this.canvas.dataset.pool = `${Math.round(width * ratio)}×${Math.round(height * ratio)}`;
    return true;
  }

  private h1Position(): [number, number] {
    const a = this.h1.getBoundingClientRect();
    const b = this.canvas.getBoundingClientRect();
    this.origin = [b.left, b.top];
    return [a.left - b.left, a.top - b.top];
  }

  private listen() {
    const c = this.canvas;
    // Every press anywhere ripples; drags on the water itself leave a wake.
    window.addEventListener("pointerdown", this.onAnyDown, { capture: true, passive: true });
    c.addEventListener("pointerdown", this.onDown);
    c.addEventListener("pointermove", this.onMove);
    c.addEventListener("pointerup", this.onEnd);
    c.addEventListener("pointercancel", this.onEnd);
    c.addEventListener("lostpointercapture", this.onEnd);
    c.addEventListener("webglcontextlost", this.onLost);
    document.addEventListener("visibilitychange", this.updateRunning);
    document.addEventListener(RIPPLE_EVENT, this.onRipple);
    document.addEventListener(SINK_EVENT, this.onSink);
    this.listenForTilt();
    this.resizer.observe(c);
    this.resizer.observe(this.h1);
    this.updateRunning();
  }

  /**
   * Tilt, only where motion needs no permission prompt (Android, most
   * desktops with sensors). iOS asks for permission, so it is skipped there.
   */
  private listenForTilt() {
    type Prompting = { requestPermission?: () => Promise<string> };
    const motion = (window as Window & { DeviceMotionEvent?: Prompting }).DeviceMotionEvent;
    const orientation = (window as Window & { DeviceOrientationEvent?: Prompting }).DeviceOrientationEvent;
    if (!motion) return;
    if (typeof motion.requestPermission === "function" || typeof orientation?.requestPermission === "function") return;
    window.addEventListener("devicemotion", this.onMotion);
  }

  private onMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null) return;
    // Gravity in the screen's plane (x right, y down), in g, turned with the screen.
    const dx = -a.x / 9.81;
    const dy = a.y / 9.81;
    const angle = (-(screen.orientation?.angle ?? 0) * Math.PI) / 180;
    this.gravity = [dx * Math.cos(angle) - dy * Math.sin(angle), dx * Math.sin(angle) + dy * Math.cos(angle)];
  };

  /** Tilting away from how the phone has been held sends waves rolling "downhill". */
  private applyTilt(dt: number) {
    const g = this.gravity;
    if (!g) return;
    const t = TUNING.tilt;
    if (!this.level) this.level = [g[0], g[1]];
    const k = clamp01(dt / t.settle);
    this.level[0] += (g[0] - this.level[0]) * k;
    this.level[1] += (g[1] - this.level[1]) * k;
    const ex = g[0] - this.level[0];
    const ey = g[1] - this.level[1];
    const m = Math.hypot(ex, ey);
    const strength = smooth((m - t.start) / (t.full - t.start));
    if (strength <= 0 || this.time < this.nextWave) return;
    this.wave = { dx: ex / m, dy: ey / m, amp: t.amp * (0.35 + 0.65 * strength), width: t.width };
    this.nextWave = this.time + t.slowEvery + (t.fastEvery - t.slowEvery) * strength;
  }

  private local(e: { clientX: number; clientY: number }): [number, number] {
    return [e.clientX - this.origin[0], e.clientY - this.origin[1]];
  }

  private onAnyDown = (e: PointerEvent) => {
    if (!e.isPrimary && e.pointerType === "mouse") return;
    const [x, y] = this.local(e);
    const d = TUNING.drops.click;
    this.drops.push({ x, y, radius: d.radius, amp: d.amp });
  };

  private onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nicety: drags still work while the pointer stays on the canvas.
    }
    const [x, y] = this.local(e);
    this.drags.set(e.pointerId, { x, y, t: e.timeStamp, carry: 0 });
  };

  /** A drag lays drops along its path: a wake, stronger the faster it goes. */
  private onMove = (e: PointerEvent) => {
    const drag = this.drags.get(e.pointerId);
    if (!drag) return;
    const [x, y] = this.local(e);
    const w = TUNING.drops.wake;
    const dist = Math.hypot(x - drag.x, y - drag.y);
    const speed = dist / Math.max(0.004, (e.timeStamp - drag.t) / 1000);
    const amp = w.amp + (w.maxAmp - w.amp) * clamp01(speed / w.fullSpeed);
    let along = w.spacing - drag.carry;
    while (along <= dist && this.drops.length < 96) {
      const f = along / dist;
      this.drops.push({ x: drag.x + (x - drag.x) * f, y: drag.y + (y - drag.y) * f, radius: w.radius, amp });
      along += w.spacing;
    }
    drag.carry = dist - (along - w.spacing);
    drag.x = x;
    drag.y = y;
    drag.t = e.timeStamp;
  };

  private onEnd = (e: PointerEvent) => {
    this.drags.delete(e.pointerId);
  };

  private onRipple = (e: Event) => {
    const detail = (e as CustomEvent<RippleDetail>).detail;
    if (!detail) return;
    const d = TUNING.drops.key;
    this.drops.push({ x: detail.x - this.origin[0], y: detail.y - this.origin[1], radius: d.radius, amp: d.amp * (0.8 + Math.random() * 0.4) });
  };

  /** A sent message: draw its letters on the floor layer, and let it land with a line of drops. */
  private onSink = (e: Event) => {
    const detail = (e as CustomEvent<SinkDetail>).detail;
    if (!detail?.element || this.disposed || !this.ready) return;
    const layout = measureWord(detail.element, this.canvas);
    if (layout.glyphs.length === 0) return;
    const [w, h] = this.size;
    const ratio = this.gl.canvas.width / w;
    this.renderer.setMessage(drawText([layout], w, h, ratio, "message"));
    const b = boundsOf(layout);
    const cx = (b.left + b.right) / 2;
    const cy = (b.top + b.bottom) / 2;
    this.message = { start: this.time, cx, cy };
    const s = TUNING.drops.sink;
    for (let i = 0; i < s.count; i++) {
      const f = (i + 0.5) / s.count;
      this.drops.push({ x: b.left + (b.right - b.left) * f, y: cy + (Math.random() - 0.5) * 10, radius: s.radius, amp: s.amp });
    }
    detail.handled = true;
  };

  private messageState(): MessageState {
    const m = TUNING.message;
    const msg = this.message;
    if (!msg) return { alpha: 0, blur: 0, scale: 1, driftY: 0, waver: 0, cx: 0, cy: 0 };
    const t = this.time - msg.start;
    const sunk = smooth(t / m.sink);
    const fade = 1 - smooth((t - m.sink - m.rest) / m.fade);
    if (fade <= 0) {
      this.message = null;
      this.renderer.setMessage(null);
      return { alpha: 0, blur: 0, scale: 1, driftY: 0, waver: 0, cx: 0, cy: 0 };
    }
    return {
      alpha: (1 - (1 - m.opacity) * sunk) * fade,
      // Blur in CSS px terms: one more mip level per doubling of the pixel ratio.
      blur: (m.blur + Math.log2(Math.max(1, this.gl.canvas.width / this.size[0]))) * sunk,
      scale: 1 - m.shrink * sunk,
      driftY: m.drift * sunk,
      waver: (m.waver - 1) * sunk,
      cx: msg.cx,
      cy: msg.cy,
    };
  }

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
    // About 60 fps is plenty for water; on 120 Hz screens, skip every other frame.
    if (now - this.lastDrawn < TUNING.frame.minInterval && this.ready) return;
    this.lastDrawn = now;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;

    // Follow the h1 if the layout moved it (a step change, the keyboard).
    const at = this.h1Position();
    const shift: [number, number] = [at[0] - this.drawnAt[0], at[1] - this.drawnAt[1]];

    this.applyTilt(dt);
    if (this.drops.length || this.wave) {
      this.renderer.disturb(this.drops, this.wave);
      this.drops.length = 0;
      this.wave = null;
    }
    this.acc += dt * 60 * TUNING.sim.stepsPer60;
    const steps = Math.min(Math.floor(this.acc), TUNING.sim.stepsPer60 * 2);
    this.acc = Math.min(this.acc - steps, 1);
    if (steps > 0) this.renderer.advance(steps);
    this.renderer.render(this.time, shift, this.messageState());

    this.monitor(dt * 1000);
    if (!this.ready) {
      this.ready = true;
      this.callbacks.onReady();
    }
  };

  /** If frames stay slow, draw fewer pixels (never below 1 per CSS px). */
  private monitor(ms: number) {
    if (this.time < 2) return;
    this.frameMs += (ms - this.frameMs) * 0.08;
    if (this.frameMs < TUNING.frame.slowFrameMs || this.pixelRatio <= 1) {
      this.slowSince = -1;
      return;
    }
    if (this.slowSince < 0) this.slowSince = this.time;
    else if (this.time - this.slowSince > 2) {
      this.pixelRatio = Math.max(1, this.pixelRatio * TUNING.frame.stepDown);
      this.slowSince = -1;
      this.frameMs = 16.7;
      this.layout();
    }
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.dispose();
    this.callbacks.onFail();
  };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    clearTimeout(this.resizeTimer);
    this.resizer.disconnect();
    window.removeEventListener("pointerdown", this.onAnyDown, { capture: true });
    window.removeEventListener("devicemotion", this.onMotion);
    document.removeEventListener("visibilitychange", this.updateRunning);
    document.removeEventListener(RIPPLE_EVENT, this.onRipple);
    document.removeEventListener(SINK_EVENT, this.onSink);
    const c = this.canvas;
    c.removeEventListener("pointerdown", this.onDown);
    c.removeEventListener("pointermove", this.onMove);
    c.removeEventListener("pointerup", this.onEnd);
    c.removeEventListener("pointercancel", this.onEnd);
    c.removeEventListener("lostpointercapture", this.onEnd);
    c.removeEventListener("webglcontextlost", this.onLost);
    // Free GPU resources but keep the context: a remount reuses this canvas.
    if (!this.gl.isContextLost()) this.renderer.dispose();
  }
}
