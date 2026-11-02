import { WaterRenderer, type Colors } from "./renderer";
import { WaterSim } from "./simulation";
import { drawWord, loadFont, measureWord, sampleTargets } from "./text-target";
import { TUNING, type Tier } from "./tuning";

/**
 * Runs the water wordmark on a canvas laid over the real h1: sizing,
 * the frame loop, pointer input, pausing off-screen, and stepping down
 * to fewer particles on slower devices.
 */

const STEP = 1 / 60;

function detectTier(): Tier {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  if (cores <= 4 || memory <= 2) return "low";
  if (matchMedia("(pointer: coarse)").matches || innerWidth < 768) return "mid";
  return "high";
}

/** Any CSS colour → linear 0–1 RGB triple (in sRGB, as the page blends). */
function readColor(value: string, fallback: [number, number, number]): [number, number, number] {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx || !value) return fallback;
  ctx.fillStyle = "#000";
  ctx.fillStyle = value.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(ctx.fillStyle);
  if (!hex) return fallback;
  const n = parseInt(hex[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

type PointerTrack = { x: number; y: number; t: number; vx: number; vy: number; downX: number; downY: number; downT: number; down: boolean };

export type WaterCallbacks = { onReady: () => void; onFail: () => void };

export class WaterEngine {
  private canvas: HTMLCanvasElement;
  private h1: HTMLElement;
  private callbacks: WaterCallbacks;
  private gl: WebGL2RenderingContext;
  private renderer: WaterRenderer;
  private sim: WaterSim | null = null;
  private instances = new Float32Array(0);

  private tier: Tier;
  private budget: number;
  private pixelRatio: number;
  private downgrades = 0;
  private pendingDowngrade = false;

  private raf = 0;
  private inView = true;
  private last = 0;
  private acc = 0;
  private time = 0;
  private frames = 0;
  private interval = 16.7;
  private slowSince = -1;
  private fieldDirty = true;
  private ready = false;
  private disposed = false;
  private size = [0, 0];
  private resizeTimer = 0;
  private pointers = new Map<number, PointerTrack>();

  private observer: IntersectionObserver;
  private resizer: ResizeObserver;

  private constructor(canvas: HTMLCanvasElement, h1: HTMLElement, gl: WebGL2RenderingContext, callbacks: WaterCallbacks) {
    this.canvas = canvas;
    this.h1 = h1;
    this.gl = gl;
    this.callbacks = callbacks;
    this.renderer = new WaterRenderer(gl);
    this.tier = detectTier();
    this.budget = TUNING.particles.budget[this.tier];
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, TUNING.render.maxPixelRatio[this.tier]);

    const root = getComputedStyle(document.documentElement);
    const colors: Colors = {
      color: readColor(root.getPropertyValue("--fg"), [0.957, 0.945, 0.918]),
      accent: readColor(root.getPropertyValue("--accent"), [0.894, 0.314, 0.169]),
    };
    this.renderer.setColors(colors);

    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.inView = entry.isIntersecting;
        this.updateRunning();
      },
      { rootMargin: "64px" },
    );
    this.resizer = new ResizeObserver(() => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.onResize(), 150);
    });
  }

  /** Starts the water, or returns null (and the static h1 stays) if it can't run. */
  static async start(canvas: HTMLCanvasElement, h1: HTMLElement, callbacks: WaterCallbacks): Promise<WaterEngine | null> {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "default",
    });
    if (!gl) return null;
    let engine: WaterEngine;
    try {
      engine = new WaterEngine(canvas, h1, gl, callbacks);
    } catch (error) {
      console.warn("[water] WebGL setup failed", error);
      return null;
    }
    await loadFont(h1);
    if (engine.disposed) return engine;
    try {
      if (!engine.build(true, true)) {
        engine.dispose();
        return null;
      }
    } catch (error) {
      console.warn("[water] Could not start", error);
      engine.dispose();
      return null;
    }
    engine.listen();
    return engine;
  }

  /** Lays out particles and mask for the canvas's current size. */
  private build(pour: boolean, benchmark = false) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width < 2 || height < 2) return false;
    this.size = [width, height];
    const layout = measureWord(this.h1, this.canvas);
    if (layout.glyphs.length === 0) return false;

    const p = TUNING.particles;
    let targets = sampleTargets(layout, width, height, this.budget, p.minSpacing);
    if (targets.count === 0) return false;

    // Time a busy physics step; use fewer particles if this device is slow.
    while (benchmark && this.downgrades < p.maxDowngrades) {
      const probe = new WaterSim(targets, width, height, false);
      probe.jostle();
      probe.step(STEP);
      probe.step(STEP);
      const t0 = performance.now();
      for (let i = 0; i < 6; i++) probe.step(STEP);
      const ms = (performance.now() - t0) / 6;
      if (ms <= p.stepBudgetMs) break;
      this.budget = Math.max(400, Math.round(this.budget * p.downgradeFactor));
      this.downgrades++;
      targets = sampleTargets(layout, width, height, this.budget, p.minSpacing);
    }

    this.sim = new WaterSim(targets, width, height, pour);
    // Visible in devtools while tuning: how many particles this device got.
    this.canvas.dataset.particles = `${targets.count} @${this.pixelRatio.toFixed(2)}x`;
    this.instances = new Float32Array(targets.count * 4);
    this.renderer.configure(width, height, this.pixelRatio, targets.spacing, targets.density);
    this.renderer.setMask(drawWord(layout, width, height, this.pixelRatio));
    this.fieldDirty = true;
    return true;
  }

  private listen() {
    const c = this.canvas;
    c.addEventListener("pointermove", this.onMove);
    c.addEventListener("pointerdown", this.onDown);
    c.addEventListener("pointerup", this.onUp);
    c.addEventListener("pointercancel", this.onEnd);
    c.addEventListener("pointerleave", this.onEnd);
    c.addEventListener("webglcontextlost", this.onLost);
    document.addEventListener("visibilitychange", this.updateRunning);
    this.observer.observe(c);
    this.resizer.observe(c);
    this.updateRunning();
  }

  private updateRunning = () => {
    const run = this.inView && !document.hidden && !this.disposed;
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
    const sim = this.sim;
    if (!sim) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;

    if (!sim.sleeping) {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= STEP && steps < 2) {
        sim.step(STEP);
        this.acc -= STEP;
        steps++;
      }
      if (this.acc > STEP) this.acc = 0; // can't keep up: slow down rather than spiral
      if (steps) this.fieldDirty = true;
    } else this.acc = 0;

    this.monitor(dt * 1000, sim);

    // At rest only the shimmer moves: draw it at half rate.
    if (sim.sleeping && !this.fieldDirty && this.frames++ & 1) return;
    if (this.fieldDirty) {
      this.renderer.splatField(this.instances, sim.writeInstances(this.instances));
      this.fieldDirty = false;
    }
    this.renderer.drawSurface(this.time, sim.fontSize);

    if (!this.ready) {
      this.ready = true;
      this.callbacks.onReady();
    }
  };

  /** Watches frame times; if they stay slow, steps down while the word is at rest (unnoticeable). */
  private monitor(ms: number, sim: WaterSim) {
    if (this.time < 1.5) return;
    this.interval += (ms - this.interval) * 0.1;
    if (this.interval > TUNING.particles.slowFrameMs) {
      if (this.slowSince < 0) this.slowSince = this.time;
      else if (this.time - this.slowSince > 2) this.pendingDowngrade = true;
    } else this.slowSince = -1;

    if (this.pendingDowngrade && sim.sleeping && !sim.pouring && this.downgrades < TUNING.particles.maxDowngrades) {
      this.downgrades++;
      this.budget = Math.max(400, Math.round(this.budget * TUNING.particles.downgradeFactor));
      this.pixelRatio = Math.max(1, this.pixelRatio * 0.8);
      this.pendingDowngrade = false;
      this.slowSince = -1;
      this.interval = 16.7;
      this.build(false);
    }
  }

  private onResize() {
    if (this.disposed) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (Math.abs(w - this.size[0]) < 1 && Math.abs(h - this.size[1]) < 1) return;
    this.build(false);
  }

  private local(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private radius(type: string) {
    const font = this.sim?.fontSize ?? 100;
    return Math.max(TUNING.pointer.minRadius * (type === "touch" ? 1.3 : 1), font * TUNING.pointer.radius);
  }

  private onMove = (e: PointerEvent) => {
    const sim = this.sim;
    if (!sim) return;
    const p = this.local(e);
    const track = this.pointers.get(e.pointerId);
    if (!track) {
      this.pointers.set(e.pointerId, { ...p, t: e.timeStamp, vx: 0, vy: 0, downX: p.x, downY: p.y, downT: 0, down: false });
      return;
    }
    const dt = Math.max(4, e.timeStamp - track.t) / 1000;
    const max = 4000 * sim.unit;
    const vx = Math.max(-max, Math.min(max, (p.x - track.x) / dt));
    const vy = Math.max(-max, Math.min(max, (p.y - track.y) / dt));
    track.vx += (vx - track.vx) * 0.6;
    track.vy += (vy - track.vy) * 0.6;
    track.x = p.x;
    track.y = p.y;
    track.t = e.timeStamp;
    sim.push(p.x, p.y, track.vx, track.vy, this.radius(e.pointerType));
  };

  private onDown = (e: PointerEvent) => {
    const p = this.local(e);
    const track: PointerTrack = { ...p, t: e.timeStamp, vx: 0, vy: 0, downX: p.x, downY: p.y, downT: e.timeStamp, down: true };
    this.pointers.set(e.pointerId, track);
    // Mouse and pen splash on press; touch waits for a tap, so starting a scroll doesn't splash.
    if (e.pointerType !== "touch" && e.button === 0) this.sim?.splash(p.x, p.y, this.radius(e.pointerType));
  };

  private onUp = (e: PointerEvent) => {
    const track = this.pointers.get(e.pointerId);
    if (e.pointerType === "touch") {
      if (track?.down) {
        const p = this.local(e);
        const moved = Math.hypot(p.x - track.downX, p.y - track.downY);
        if (moved < 12 && e.timeStamp - track.downT < 450) this.sim?.splash(p.x, p.y, this.radius("touch"));
      }
      this.pointers.delete(e.pointerId);
    } else if (track) track.down = false;
  };

  private onEnd = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
  };

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
    this.observer.disconnect();
    this.resizer.disconnect();
    document.removeEventListener("visibilitychange", this.updateRunning);
    const c = this.canvas;
    c.removeEventListener("pointermove", this.onMove);
    c.removeEventListener("pointerdown", this.onDown);
    c.removeEventListener("pointerup", this.onUp);
    c.removeEventListener("pointercancel", this.onEnd);
    c.removeEventListener("pointerleave", this.onEnd);
    c.removeEventListener("webglcontextlost", this.onLost);
    // Free GPU resources but keep the context: a remount reuses this canvas.
    if (!this.gl.isContextLost()) this.renderer.dispose();
    this.sim = null;
  }
}
