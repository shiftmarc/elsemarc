import { loadFont, measureWord, type WordLayout } from "../text-layout";
import type { ElementHooks, ElementScene } from "../types";
import { GardenRenderer, SPRITE_FLOATS, type Op, type Rect } from "./renderer";
import { TUNING } from "./tuning";

/**
 * Earth: a zen garden. Pale sand seen from above in bright, low daylight,
 * raked in long lines by hand, with the wordmark stamped into it and its
 * accent a smooth stone with rings raked around it. The page switches to
 * its light palette for it (globals.css).
 *
 * Dragging rakes deep grooves that slowly settle back; a tap leaves a
 * crater and throws grains; each keystroke drops a pebble that leaves a
 * dent; a sent message is pressed into the sand, then the wind erases it.
 * It never stands still: a breeze (gusting once the visitor is idle) sends
 * streamers of fine sand snaking across with grains skittering along, and
 * wears the lines down; an invisible rake slowly redraws them, one pass at
 * a time.
 *
 * The stage (../stage.ts) runs the clock and hands over the visitor's input.
 */

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
const between = (range: readonly [number, number]) => range[0] + Math.random() * (range[1] - range[0]);

// The shaders' hash and value noise (gl.ts), so the grains can follow the streamers drawn there.
function hash(x: number, y: number) {
  let n = Math.imul(Math.imul(x, 1597334673) ^ Math.imul(y, 3812015801 | 0), 1597334673);
  n ^= n >>> 16;
  n = Math.imul(n, 2246822519 | 0);
  n ^= n >>> 13;
  return (n >>> 0) / 4294967295;
}

function noise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * ux;
  const b = hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * ux;
  return a + (b - a) * uy;
}

const W = TUNING.wind;
const WIND_LEN = Math.hypot(W.dir[0], W.dir[1]);
/** Along the wind, and across it. */
const ALONG: [number, number] = [W.dir[0] / WIND_LEN, W.dir[1] / WIND_LEN];
const ACROSS: [number, number] = [-ALONG[1], ALONG[0]];

/** A streamer lane at `u` along the wind: its centreline across the wind, its width, how much sand it carries (as in renderer.ts). */
function streamer(lane: number, u: number, time: number) {
  const h1 = hash(lane, 7);
  const h2 = hash(lane, 13);
  const travel = u - time * W.streamerSpeed * (0.8 + 0.4 * h1);
  const centre =
    (lane + 0.5) * W.lane +
    (h2 - 0.5) * W.lane * 0.5 +
    22 * Math.sin(travel / 170 + h1 * Math.PI * 2) +
    8 * Math.sin(travel / 61 + h2 * Math.PI * 2);
  const width = 4 + 7 * noise(travel / 110, lane * 1.7);
  return { centre, width, packet: smooth((noise(travel / 240, lane * 3.1) - 0.42) / 0.36) };
}

type Bounds = { left: number; right: number; top: number; bottom: number };

/** The ink's real extent: each glyph's measured box (letter spacing and kerning come from the DOM positions). */
function inkBounds(layout: WordLayout, accentOnly = false): Bounds {
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = layout.font;
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const g of layout.glyphs) {
    if (accentOnly && !g.accent) continue;
    const m = ctx.measureText(g.ch);
    left = Math.min(left, g.x - m.actualBoundingBoxLeft);
    right = Math.max(right, g.x + m.actualBoundingBoxRight);
    top = Math.min(top, g.baseline - m.actualBoundingBoxAscent);
    bottom = Math.max(bottom, g.baseline + m.actualBoundingBoxDescent);
  }
  return { left, right, top, bottom };
}

/** Draws `layout` over `rect` at `scale` px per CSS px: letters red and the accent green, or all white. */
function drawMask(layout: WordLayout, rect: Rect, scale: number, mode: "word" | "message") {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.w * scale));
  canvas.height = Math.max(1, Math.round(rect.h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.translate(-rect.x, -rect.y);
  ctx.globalCompositeOperation = "lighter";
  ctx.textBaseline = "alphabetic";
  ctx.font = layout.font;
  for (const g of layout.glyphs) {
    ctx.fillStyle = mode === "message" ? "#fff" : g.accent ? "#0f0" : "#f00";
    ctx.fillText(g.ch, g.x, g.baseline);
  }
  return canvas;
}

/** A grain or pebble: flying (z > 0 or rising), resting, then fading into the sand; or skittering along a streamer. */
type Sprite = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  pebble: boolean;
  angle: number;
  aspect: number;
  born: number;
  landed: number;
  /** Skittering grains only: seconds they run along a streamer, which lane, where along it, how far off its centre. */
  drift: number;
  lane: number;
  u: number;
  off: number;
  alpha: number;
};

export class EarthScene implements ElementScene {
  readonly idleAfter = 3.5;

  private canvas: HTMLCanvasElement;
  private h1: HTMLElement;
  private hooks: ElementHooks;
  private gl: WebGL2RenderingContext;
  private renderer: GardenRenderer;

  private pixelRatio: number;
  private size: [number, number] = [0, 0];
  private origin: [number, number] = [0, 0];
  private drawnAt: [number, number] = [0, 0];
  private period = 9;

  private time = 0;
  private frameMs = 16.7;
  private slowSince = -1;
  private disposed = false;
  private resizeTimer = 0;

  private ops: Op[] = [];
  private drags = new Map<number, { x: number; y: number }>();
  private sprites: Sprite[] = [];
  private spriteData = new Float32Array(TUNING.grains.max * SPRITE_FLOATS);

  // Wind: a breeze always, gusting while the visitor is idle (the stage asks for ambience), easing when they return.
  private lastAmbience = -Infinity;
  private gusting = 0;
  private windLevel: number = W.breeze;
  private nextSkitter = 0;

  /** The invisible rake: which band of lines it's redrawing, which way, and where it is. */
  private gardener = { band: -1, bands: 1, dir: 1, x: 0, flick: 0 };

  private message: { start: number } | null = null;

  private resizer: ResizeObserver;

  private constructor(canvas: HTMLCanvasElement, h1: HTMLElement, gl: WebGL2RenderingContext, hooks: ElementHooks) {
    this.canvas = canvas;
    this.h1 = h1;
    this.gl = gl;
    this.hooks = hooks;
    this.renderer = new GardenRenderer(gl);
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, TUNING.render.maxPixelRatio);

    // The sand is the garden's own; the stone takes the page's accent.
    const root = getComputedStyle(document.documentElement);
    this.renderer.setColors({
      sand: TUNING.palette.sand,
      high: TUNING.palette.high,
      accent: readColor(root.getPropertyValue("--accent"), [0.72, 0.22, 0.1]),
    });

    this.resizer = new ResizeObserver(() => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.layout(), 120);
    });
  }

  /** Starts the garden, or returns null (and the still h1 stays) if it can't run. */
  static async start(canvas: HTMLCanvasElement, h1: HTMLElement, hooks: ElementHooks): Promise<EarthScene | null> {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "default",
    });
    if (!gl) return null;
    let scene: EarthScene;
    try {
      scene = new EarthScene(canvas, h1, gl, hooks);
    } catch (error) {
      console.warn("[earth] WebGL setup failed", error);
      return null;
    }
    await loadFont(h1);
    try {
      if (!scene.layout()) {
        scene.dispose();
        return null;
      }
    } catch (error) {
      console.warn("[earth] Could not start", error);
      scene.dispose();
      return null;
    }
    scene.canvas.addEventListener("webglcontextlost", scene.onLost);
    scene.resizer.observe(scene.canvas);
    scene.resizer.observe(scene.h1);
    return scene;
  }

  /** Sizes everything to the canvas and presses the h1's letters into the sand. */
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

    const g = TUNING.garden;
    const w = TUNING.word;
    const fs = word.fontSize;
    const b = inkBounds(word);
    this.period = Math.min(g.period[1], Math.max(g.period[0], Math.min(width, height) * g.periodShare));
    const bevel = Math.max(w.bevelMin, fs * w.bevel);
    const rimSpread = fs * w.rimSpread;
    const stoneBlur = fs * w.stoneBlur;
    const reach = Math.ceil(3 * Math.max(rimSpread, stoneBlur) + 4);
    const rect = { x: b.left - reach, y: b.top - reach, w: b.right - b.left + 2 * reach, h: b.bottom - b.top + 2 * reach };
    const scale = Math.min(ratio, 2);
    this.renderer.setWord(drawMask(word, rect, scale, "word"), rect, scale, [bevel, rimSpread, stoneBlur]);

    // The rings go round the stone (the accent) only; without one, a small circle at the word's centre.
    const hasStone = word.glyphs.some((glyph) => glyph.accent);
    const s = hasStone ? inkBounds(word, true) : b;
    const radius = hasStone ? Math.max(s.right - s.left, s.bottom - s.top) / 2 + stoneBlur : fs * 0.1;
    this.renderer.setGarden({
      stone: [(s.left + s.right) / 2, (s.top + s.bottom) / 2, radius],
      margin: radius * g.ringGap + 2,
      rings: g.rings,
      period: this.period,
      amp: g.amp * this.period,
      depth: Math.min(w.depthRange[1], Math.max(w.depthRange[0], fs * w.depth)),
      rim: w.rim,
      stoneHeight: fs * w.stoneHeight,
    });
    // A new garden: its lines worn unevenly, so the invisible rake's fresh passes show.
    if (this.renderer.fresh) {
      this.ops.push({ kind: "wear", level: 0.62, spread: 0.3, scale: 300 });
      this.renderer.fresh = false;
    }
    this.gardener.bands = Math.max(1, Math.ceil(height / (TUNING.gardener.lines * this.period)));
    this.drawnAt = this.h1Position();
    this.canvas.dataset.garden = `${Math.round(width * ratio)}×${Math.round(height * ratio)}`;
    return true;
  }

  private h1Position(): [number, number] {
    const a = this.h1.getBoundingClientRect();
    const b = this.canvas.getBoundingClientRect();
    this.origin = [b.left, b.top];
    return [a.left - b.left, a.top - b.top];
  }

  private local(e: { clientX: number; clientY: number }): [number, number] {
    return [e.clientX - this.origin[0], e.clientY - this.origin[1]];
  }

  private spawn(s: Partial<Sprite> & { x: number; y: number }) {
    if (this.sprites.length >= TUNING.grains.max) this.sprites.shift();
    this.sprites.push({
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      size: 1.4,
      pebble: false,
      angle: Math.random() * Math.PI,
      aspect: 1,
      born: this.time,
      landed: -1,
      drift: 0,
      lane: 0,
      u: 0,
      off: 0,
      alpha: 1,
      ...s,
    });
  }

  /** Grains thrown out from (x, y). */
  private scatter(
    x: number,
    y: number,
    count: number,
    from: number,
    speed: readonly [number, number],
    lift: readonly [number, number],
    size: readonly [number, number] = [1.1, 2],
  ) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = between(speed);
      this.spawn({
        x: x + Math.cos(a) * from,
        y: y + Math.sin(a) * from,
        z: 0.5,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        vz: between(lift),
        size: between(size),
        aspect: 1 + Math.random() * 0.4,
      });
    }
  }

  /** A tap: a crater, grains thrown out of it. */
  press(e: PointerEvent) {
    if (!e.isPrimary && e.pointerType === "mouse") return;
    const [x, y] = this.local(e);
    const c = TUNING.crater;
    this.ops.push({ kind: "crater", x, y, radius: c.radius, depth: c.depth, rim: c.rim, flatten: 0.85 });
    this.scatter(x, y, c.grains, c.radius * 0.35, c.speed, c.lift, c.size);
  }

  dragStart(e: PointerEvent) {
    const [x, y] = this.local(e);
    this.drags.set(e.pointerId, { x, y });
  }

  /** The rake follows the drag, its tines across the way it's pulled. */
  drag(e: PointerEvent) {
    const last = this.drags.get(e.pointerId);
    if (!last) return;
    const [x, y] = this.local(e);
    if (Math.hypot(x - last.x, y - last.y) < TUNING.rake.step) return;
    const r = TUNING.rake;
    const half = (r.tines / 2) * r.spacing * this.period;
    this.ops.push({ kind: "rake", x0: last.x, y0: last.y, x1: x, y1: y, half, depth: r.depth, berm: r.berm });
    last.x = x;
    last.y = y;
  }

  dragEnd(e: PointerEvent) {
    this.drags.delete(e.pointerId);
  }

  /** A keystroke: a pebble drops in just under the field. */
  keystroke(x: number, y: number) {
    const p = TUNING.pebble;
    this.spawn({
      x: x - this.origin[0],
      y: y - this.origin[1],
      z: p.drop * (0.8 + Math.random() * 0.4),
      size: between(p.size),
      pebble: true,
      aspect: 1.15 + Math.random() * 0.3,
    });
  }

  /** A sent message: pressed into the sand where it was typed. */
  sink(text: HTMLElement) {
    if (this.disposed) return false;
    const layout = measureWord(text, this.canvas);
    if (layout.glyphs.length === 0) return false;
    const m = TUNING.message;
    const b = inkBounds(layout);
    const reach = Math.ceil(3 * m.rimSpread + 3);
    const rect = { x: b.left - reach, y: b.top - reach, w: b.right - b.left + 2 * reach, h: b.bottom - b.top + 2 * reach };
    const scale = Math.min(this.gl.canvas.width / this.size[0], 2);
    this.renderer.setMessage(drawMask(layout, rect, scale, "message"), rect, scale, [m.bevel, m.rimSpread]);
    this.ops.push({ kind: "stamp", rect });
    this.message = { start: this.time };
    // A little sand puffs out along it.
    for (let i = 0; i < 10; i++) {
      const x = b.left + Math.random() * (b.right - b.left);
      const y = b.top + Math.random() * (b.bottom - b.top);
      this.scatter(x, y, 1, 0, [20, 55], [40, 90]);
    }
    return true;
  }

  /** Idle: the wind gusts. */
  ambience(time: number) {
    this.time = time;
    this.lastAmbience = time;
  }

  /** A loose grain skittering along a streamer, if one is passing a random spot on screen. */
  private skitter() {
    const [w, h] = this.size;
    let uMin = Infinity;
    let uMax = -Infinity;
    let vMin = Infinity;
    let vMax = -Infinity;
    for (const [x, y] of [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
    ]) {
      const u = x * ALONG[0] + y * ALONG[1];
      const v = x * ACROSS[0] + y * ACROSS[1];
      uMin = Math.min(uMin, u);
      uMax = Math.max(uMax, u);
      vMin = Math.min(vMin, v);
      vMax = Math.max(vMax, v);
    }
    for (let tries = 0; tries < 6; tries++) {
      const lane = Math.floor((vMin + Math.random() * (vMax - vMin)) / W.lane);
      const u = uMin + Math.random() * (uMax - uMin);
      const st = streamer(lane, u, this.time);
      if (st.packet < 0.45) continue;
      const off = (Math.random() - 0.5) * st.width * 1.2;
      const x = u * ALONG[0] + (st.centre + off) * ACROSS[0];
      const y = u * ALONG[1] + (st.centre + off) * ACROSS[1];
      if (x < -10 || y < -10 || x > w + 10 || y > h + 10) continue;
      this.spawn({ x, y, vx: between(W.grainSpeed), size: 0.9 + Math.random() * 0.8, drift: between(W.grainLife), lane, u, off, alpha: 0 });
      return;
    }
  }

  /** The invisible rake moves on along its band, redrawing the lines behind it; then the next band, the other way. */
  private tend(dt: number) {
    const gd = TUNING.gardener;
    const g = this.gardener;
    const width = this.size[0];
    const bandH = gd.lines * this.period;
    if (g.band < 0 || g.x < -40 || g.x > width + 40) {
      g.band = g.band < 0 ? Math.floor(Math.random() * g.bands) : (g.band + 1) % g.bands;
      g.dir = g.band % 2 === 0 ? 1 : -1;
      g.x = g.dir > 0 ? -30 : width + 30;
    }
    // A message being erased is left to the wind.
    if (this.message) return;
    const y = (g.band + 0.5) * bandH;
    const x = g.x + g.dir * gd.speed * Math.min(dt, 0.1);
    this.ops.push({ kind: "refresh", x0: g.x, y0: y, x1: x, y1: y, half: bandH / 2, heap: gd.heap, period: this.period });
    g.x = x;
    // Now and then a grain flicks up off its tines.
    g.flick += dt * gd.flick;
    while (g.flick >= 1) {
      g.flick -= 1;
      const v = between([25, 60]);
      const a = (Math.random() - 0.5) * 0.9;
      this.spawn({
        x: x + g.dir * 3,
        y: y + (Math.random() - 0.5) * bandH,
        z: 0.5,
        vx: g.dir * v * Math.cos(a),
        vy: v * Math.sin(a),
        vz: between([40, 90]),
        size: 1 + Math.random() * 0.7,
      });
    }
  }

  /** Flying grains fall, land, rest and fade; pebbles dent the sand where they land, then sink; skittering grains hop along. */
  private updateSprites(dt: number) {
    const gr = TUNING.grains;
    const pb = TUNING.pebble;
    let count = 0;
    const keep: Sprite[] = [];
    for (const s of this.sprites) {
      let size = s.size;
      if (s.drift > 0) {
        // Skittering along its streamer: little hops, following the ribbon as it snakes.
        const age = this.time - s.born;
        if (age > s.drift) continue;
        s.u += s.vx * dt;
        const v = streamer(s.lane, s.u, this.time).centre + s.off;
        s.x = s.u * ALONG[0] + v * ACROSS[0];
        s.y = s.u * ALONG[1] + v * ACROSS[1];
        s.z = 1.6 * Math.abs(Math.sin(age * 11 + s.angle * 3));
        s.alpha = smooth(age / 0.35) * (1 - smooth((age - s.drift + 0.6) / 0.6)) * (0.5 + 0.5 * this.windLevel);
      } else if (s.landed < 0) {
        s.vz -= gr.gravity * (s.pebble ? 0.6 : 1) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.z += s.vz * dt;
        if (s.z <= 0) {
          s.z = 0;
          s.landed = this.time;
          s.vx *= 0.2;
          s.vy *= 0.2;
          if (s.pebble) {
            this.ops.push({ kind: "crater", x: s.x, y: s.y, radius: pb.dentRadius * (s.size / 7), depth: pb.dentDepth, rim: 0.35, flatten: 0.6 });
            this.scatter(s.x, s.y, 2, s.size * 0.4, [20, 45], [30, 70]);
          }
        }
      } else {
        const age = this.time - s.landed;
        // A short skid, then still.
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= Math.exp(-dt * 12);
        s.vy *= Math.exp(-dt * 12);
        if (s.pebble) {
          const k = smooth((age - pb.rest) / pb.sink);
          s.alpha = 1 - k;
          size *= 1 - 0.35 * k;
        } else s.alpha = 1 - smooth((age - gr.rest) / gr.fade);
        if (s.alpha <= 0) continue;
      }
      keep.push(s);
      if (s.alpha > 0.002 && count < TUNING.grains.max) {
        this.spriteData.set([s.x, s.y, s.z, size, s.pebble ? 1 : 0, s.alpha, s.angle, s.aspect], count * SPRITE_FLOATS);
        count++;
      }
    }
    this.sprites = keep;
    return count;
  }

  /** The message's progress: how pressed in it is, and how fast the wind is erasing it. */
  private messageState() {
    const m = TUNING.message;
    if (!this.message) return { press: 0, erode: 0, wind: 0 };
    const t = this.time - this.message.start;
    const erodeAt = m.press + m.hold;
    if (t > erodeAt + m.erode * 1.8) {
      this.message = null;
      this.renderer.setMessage(null, { x: 0, y: 0, w: 1, h: 1 }, 1, [0, 0]);
      return { press: 0, erode: 0, wind: 0 };
    }
    const erode = t > erodeAt ? 1 / m.erode : 0;
    const wind = smooth((t - erodeAt + 1) / 1.5) * (1 - smooth((t - erodeAt - m.erode) / 2)) * m.wind;
    return { press: smooth(t / m.press), erode, wind };
  }

  frame(time: number, dt: number) {
    this.time = time;

    // Follow the h1 if the layout moved it (a step change, the keyboard).
    const at = this.h1Position();
    this.renderer.setShift([at[0] - this.drawnAt[0], at[1] - this.drawnAt[1]]);

    const idle = time - this.lastAmbience < 0.2 ? 1 : 0;
    this.gusting += (idle - this.gusting) * (1 - Math.exp(-dt / (idle > this.gusting ? W.rise : W.fall)));
    const msg = this.messageState();
    const wind = Math.max(W.breeze + (1 - W.breeze) * this.gusting, msg.wind);
    this.windLevel = wind;

    // Loose grains skitter along the streamers, more of them the stronger the wind.
    if (time >= this.nextSkitter) {
      this.skitter();
      this.nextSkitter = time + between(W.grainGap) / Math.max(wind, 0.1);
    }
    this.tend(dt);

    const count = this.updateSprites(dt);
    if (this.ops.length) {
      this.renderer.disturb(this.ops);
      this.ops.length = 0;
    }
    this.renderer.setWind(wind, time);
    this.renderer.settle(dt, msg.erode);
    this.renderer.render(time, msg.press, this.spriteData, count);
    this.canvas.dataset.wind = wind.toFixed(2);
    this.canvas.dataset.gardener = `${this.gardener.band}:${Math.round(this.gardener.x)}`;

    this.monitor(dt * 1000);
  }

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
    this.hooks.fail();
  };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    clearTimeout(this.resizeTimer);
    this.resizer.disconnect();
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    if (!this.gl.isContextLost()) this.renderer.dispose();
  }
}
