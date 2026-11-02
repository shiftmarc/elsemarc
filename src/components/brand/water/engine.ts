import { DISSOLVE_EVENT, type DissolveDetail } from "./dissolve";
import { STRIDE, WaterRenderer, type Colors } from "./renderer";
import { WaterSim } from "./simulation";
import { drawWord, loadFont, measureWord, sampleTargets } from "./text-target";
import { TUNING, type Tier } from "./tuning";

/**
 * Runs the water tank on a full-screen canvas behind the real h1: sizing,
 * the frame loop, gestures (drag, hold, swipe, tap), phone tilt, text
 * dissolving into the water, pausing when hidden, and stepping down to
 * fewer particles on slower devices.
 */

const STEP = 1 / 60;

function detectTier(): Tier {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  if (cores <= 4 || memory <= 2) return "low";
  if (matchMedia("(pointer: coarse)").matches || innerWidth < 768) return "mid";
  return "high";
}

/** Any CSS colour → 0–1 RGB (sRGB, as the page blends). */
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

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type PointerTrack = {
  type: string;
  x: number;
  y: number;
  t: number;
  vx: number;
  vy: number;
  downX: number;
  downY: number;
  downT: number;
  moved: number;
  stillSince: number;
  collapsed: boolean;
};

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

  // Tilt: target from the sensor, smoothed value used by the water.
  private tiltOn = false;
  private tiltTarget = [0, 1];
  private tilt = [0, 1];

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
      base: readColor(root.getPropertyValue("--surface"), [0.094, 0.094, 0.086]),
      color: readColor(root.getPropertyValue("--fg"), [0.957, 0.945, 0.918]),
      accent: readColor(root.getPropertyValue("--accent"), [0.894, 0.314, 0.169]),
    };
    this.renderer.setColors(colors);

    this.observer = new IntersectionObserver(([entry]) => {
      this.inView = entry.isIntersecting;
      this.updateRunning();
    });
    this.resizer = new ResizeObserver(() => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.onResize(), 150);
    });
  }

  /** Starts the water, or returns null (and the still h1 stays) if it can't run. */
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
    this.sim.setGravity(this.tilt[0], this.tilt[1], 0);
    this.instances = new Float32Array(this.sim.capacity * STRIDE);
    this.renderer.configure(width, height, this.pixelRatio, targets.spacing, targets.density, targets.fontSize);
    this.renderer.setMask(drawWord(layout, width, height, this.pixelRatio));
    // Visible in devtools while tuning: how many particles this device got.
    this.canvas.dataset.particles = `${targets.count} @${this.pixelRatio.toFixed(2)}x`;
    this.fieldDirty = true;
    return true;
  }

  private listen() {
    const c = this.canvas;
    c.addEventListener("pointerdown", this.onDown);
    c.addEventListener("pointermove", this.onMove);
    c.addEventListener("pointerup", this.onUp);
    c.addEventListener("pointercancel", this.onEnd);
    c.addEventListener("lostpointercapture", this.onEnd);
    c.addEventListener("webglcontextlost", this.onLost);
    document.addEventListener("visibilitychange", this.updateRunning);
    document.addEventListener(DISSOLVE_EVENT, this.onDissolve);
    this.listenForTilt();
    this.observer.observe(c);
    this.resizer.observe(c);
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
    // Device frame (x right, y down the screen), then into the screen's current rotation.
    const dx = -a.x / 9.81;
    const dy = a.y / 9.81;
    const angle = (-(screen.orientation?.angle ?? 0) * Math.PI) / 180;
    const gx = dx * Math.cos(angle) - dy * Math.sin(angle);
    const gy = dx * Math.sin(angle) + dy * Math.cos(angle);
    const m = Math.hypot(gx, gy);
    // Lying flat, gravity points into the screen: keep "down".
    this.tiltTarget = m > 0.3 ? [gx / m, gy / m] : [0, 1];
    this.tiltOn = true;
  };

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

    this.applyTilt(sim, dt);
    this.applyHolds(sim, now, dt);

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
    this.renderer.drawSurface(this.time);

    if (!this.ready) {
      this.ready = true;
      this.callbacks.onReady();
    }
  };

  private applyTilt(sim: WaterSim, dt: number) {
    if (!this.tiltOn) return;
    const k = Math.min(1, dt * TUNING.tilt.follow);
    this.tilt[0] += (this.tiltTarget[0] - this.tilt[0]) * k;
    this.tilt[1] += (this.tiltTarget[1] - this.tilt[1]) * k;
    const m = Math.hypot(this.tilt[0], this.tilt[1]) || 1;
    const gx = this.tilt[0] / m;
    const gy = this.tilt[1] / m;
    const degrees = (Math.acos(Math.max(-1, Math.min(1, gy))) * 180) / Math.PI;
    const loosen = smoothstep(TUNING.tilt.start, TUNING.tilt.full, degrees) * TUNING.tilt.loosen;
    sim.setGravity(gx, gy, loosen);
  }

  /** A pressed pointer that has stayed (nearly) still is holding: it draws the water in. */
  private applyHolds(sim: WaterSim, now: number, dt: number) {
    const g = TUNING.gestures;
    for (const track of this.pointers.values()) {
      if (now - track.stillSince < g.holdDelay * 1000) continue;
      sim.attract(track.x, track.y, sim.fontSize * g.holdRadius, dt);
    }
  }

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

  private onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const p = this.local(e);
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nicety: drags still work while the pointer stays on the canvas.
    }
    this.pointers.set(e.pointerId, {
      type: e.pointerType,
      ...p,
      t: e.timeStamp,
      vx: 0,
      vy: 0,
      downX: p.x,
      downY: p.y,
      downT: e.timeStamp,
      moved: 0,
      stillSince: e.timeStamp,
      collapsed: false,
    });
  };

  private onMove = (e: PointerEvent) => {
    const sim = this.sim;
    const track = this.pointers.get(e.pointerId);
    if (!sim || !track) return; // only pressed pointers move the water
    const p = this.local(e);
    const step = Math.hypot(p.x - track.x, p.y - track.y);
    const dt = Math.max(4, e.timeStamp - track.t) / 1000;
    track.vx += ((p.x - track.x) / dt - track.vx) * 0.6;
    track.vy += ((p.y - track.y) / dt - track.vy) * 0.6;
    track.x = p.x;
    track.y = p.y;
    track.t = e.timeStamp;
    track.moved += step;
    const speed = Math.hypot(track.vx, track.vy);
    const g = TUNING.gestures;
    if (speed > g.holdSpeed) track.stillSince = e.timeStamp;

    const short = Math.min(this.size[0], this.size[1]);
    const fast = Math.max(g.swipeMinSpeed, g.swipeSpeed * short);
    if (!track.collapsed && speed > fast && track.moved > g.swipeDistance * short) {
      track.collapsed = true;
      sim.collapse(Math.sign(track.vx));
    } else sim.push(p.x, p.y, track.vx, track.vy, this.radius(track.type));
  };

  private onUp = (e: PointerEvent) => {
    const track = this.pointers.get(e.pointerId);
    this.pointers.delete(e.pointerId);
    if (!track) return;
    const g = TUNING.gestures;
    const p = this.local(e);
    const moved = Math.hypot(p.x - track.downX, p.y - track.downY);
    if (moved < g.tapMove && e.timeStamp - track.downT < g.tapTime * 1000) this.sim?.splash(p.x, p.y, this.radius(track.type));
  };

  private onEnd = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
  };

  private onDissolve = (e: Event) => {
    const detail = (e as CustomEvent<DissolveDetail>).detail;
    const sim = this.sim;
    if (!sim || !detail?.element || this.disposed) return;
    const layout = measureWord(detail.element, this.canvas);
    if (layout.glyphs.length === 0) return;
    const targets = sampleTargets(layout, this.size[0], this.size[1], TUNING.dissolve.maxParticles, sim.spacing);
    if (sim.dissolve(targets) > 0) {
      detail.handled = true;
      this.fieldDirty = true;
    }
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
    document.removeEventListener(DISSOLVE_EVENT, this.onDissolve);
    window.removeEventListener("devicemotion", this.onMotion);
    const c = this.canvas;
    c.removeEventListener("pointerdown", this.onDown);
    c.removeEventListener("pointermove", this.onMove);
    c.removeEventListener("pointerup", this.onUp);
    c.removeEventListener("pointercancel", this.onEnd);
    c.removeEventListener("lostpointercapture", this.onEnd);
    c.removeEventListener("webglcontextlost", this.onLost);
    // Free GPU resources but keep the context: a remount reuses this canvas.
    if (!this.gl.isContextLost()) this.renderer.dispose();
    this.sim = null;
  }
}
