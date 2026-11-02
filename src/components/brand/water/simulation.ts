import type { Targets } from "./text-target";
import { TUNING } from "./tuning";

/**
 * A small 2D liquid: particles with double-density relaxation (Clavet et
 * al., 2005) for pressure, plus viscosity, and a memory of the word.
 *
 * Particles [0, words) belong to the word: each has a home in a letter.
 * Every word particle carries an "excitation" from 0 (calm) to 1
 * (disturbed). Disturbed water falls under gravity and ignores the word;
 * as it calms, gravity fades and a capped pull flows it home, so splashes
 * fall, pool, then climb back into the letters.
 *
 * Particles [words, count) are transient: water made from text the visitor
 * sends. They fall, mix with the word's water, and fade away.
 */
export class WaterSim {
  readonly words: number;
  readonly capacity: number;
  readonly spacing: number;
  readonly fontSize: number;
  readonly unit: number;
  count: number;
  sleeping = false;

  private px: Float32Array;
  private py: Float32Array;
  private vx: Float32Array;
  private vy: Float32Array;
  private ox: Float32Array;
  private oy: Float32Array;
  private hx: Float32Array;
  private hy: Float32Array;
  private ex: Float32Array;
  private calmRate: Float32Array;
  /** Seconds a collapsed word particle rests in the pool before it starts calming (words only). */
  private hold: Float32Array;
  private release: Float32Array;
  private life: Float32Array;
  private active: Uint8Array;
  private inTank: Uint8Array;
  private accent: Uint8Array;

  private width: number;
  private height: number;
  private top: number;
  private h: number;
  private rho0 = 1;
  private time = 0;
  private quiet = 0;
  private allActive: boolean;
  private gx = 0;
  private gy = 1;

  // Spatial grid, rebuilt each step.
  private cols = 1;
  private rows = 1;
  private cellStart: Int32Array;
  private cellItems: Int32Array;
  private cellOf: Int32Array;
  // Neighbour scratch.
  private nb = new Int32Array(256);
  private nq = new Float32Array(256);
  private nx = new Float32Array(256);
  private ny = new Float32Array(256);

  constructor(t: Targets, width: number, height: number, pour: boolean) {
    const n = t.count;
    const cap = n + TUNING.dissolve.maxParticles;
    this.words = n;
    this.count = n;
    this.capacity = cap;
    this.spacing = t.spacing;
    this.fontSize = t.fontSize;
    this.unit = t.fontSize / 200;
    this.width = width;
    this.height = height;
    this.h = t.spacing * TUNING.fluid.radius;
    this.top = t.fontSize * (TUNING.pour.stretch + 0.6) + 40;

    const grow = (src: ArrayLike<number>) => {
      const a = new Float32Array(cap);
      a.set(src);
      return a;
    };
    this.px = grow(t.hx);
    this.py = grow(t.hy);
    this.hx = grow(t.hx);
    this.hy = grow(t.hy);
    this.vx = new Float32Array(cap);
    this.vy = new Float32Array(cap);
    this.ox = new Float32Array(cap);
    this.oy = new Float32Array(cap);
    this.ex = new Float32Array(cap);
    this.calmRate = new Float32Array(cap).fill(1 / TUNING.recall.calm);
    this.hold = new Float32Array(cap);
    this.release = new Float32Array(cap);
    this.life = new Float32Array(cap);
    this.active = new Uint8Array(cap).fill(1);
    this.inTank = new Uint8Array(cap).fill(1);
    this.accent = new Uint8Array(cap);
    this.accent.set(t.accent);
    this.cellOf = new Int32Array(cap);
    this.cellItems = new Int32Array(cap);
    this.cellStart = new Int32Array(2);

    this.rho0 = this.restDensity();
    this.allActive = true;
    if (pour) this.preparePour();
  }

  /** Density of the word at rest, so resting water feels no pressure. */
  private restDensity() {
    this.buildGrid();
    const rho = new Float32Array(this.words);
    for (let i = 0; i < this.words; i++) {
      const k = this.neighbours(i);
      let r = 0;
      for (let j = 0; j < k; j++) r += (1 - this.nq[j]) * (1 - this.nq[j]);
      rho[i] = r;
    }
    rho.sort();
    return Math.max(rho[Math.floor(this.words * 0.7)] ?? 1, 0.5);
  }

  /** Puts every particle above the tank and schedules it to fall into its letter. */
  private preparePour() {
    const { delay, sweep, jitter, stretch, scatter } = TUNING.pour;
    const g = TUNING.fluid.gravity * this.unit;
    const v0 = 0.25 * Math.sqrt(2 * g * this.fontSize);
    let bottom = 0;
    for (let i = 0; i < this.words; i++) bottom = Math.max(bottom, this.hy[i]);
    for (let i = 0; i < this.words; i++) {
      // The lowest water leads, so each letter fills from the bottom up.
      this.px[i] = this.hx[i] + (Math.random() - 0.5) * this.spacing * scatter;
      this.py[i] = -10 - (bottom - this.hy[i]) * stretch - Math.random() * this.spacing;
      this.vy[i] = v0;
      this.ex[i] = 1;
      const fall = this.hy[i] - this.py[i];
      const t = (-v0 + Math.sqrt(v0 * v0 + 2 * g * fall)) / g;
      this.calmRate[i] = 1 / (t * 1.25 + 0.15);
      this.release[i] = delay + (this.hx[i] / Math.max(this.width, 1)) * sweep + Math.random() * jitter;
      this.active[i] = 0;
      this.inTank[i] = 0;
    }
    this.allActive = false;
  }

  /** Whether any water is still waiting to fall in. */
  get pouring() {
    return !this.allActive;
  }

  step(dt: number) {
    this.time += dt;
    const { px, py, vx, vy, ox, oy, ex, calmRate, hold, active, life, words } = this;
    const g = TUNING.fluid.gravity * this.unit;
    const gx = this.gx * g;
    const gy = this.gy * g;
    const drag = TUNING.fluid.drag;
    const damping = TUNING.recall.damping;

    let waiting = false;
    for (let i = 0; i < this.count; i++) {
      if (!active[i]) {
        if (this.time < this.release[i]) {
          waiting = true;
          continue;
        }
        active[i] = 1;
      }
      const e = ex[i];
      // Calming water loses momentum, so it eases home instead of overshooting.
      const settle = 1 - damping * (1 - e) * (1 - e);
      vx[i] = (vx[i] + gx * e * dt) * drag * settle;
      vy[i] = (vy[i] + gy * e * dt) * drag * settle;
      if (i < words) {
        if (hold[i] > 0) hold[i] -= dt;
        else ex[i] = e > 0 ? Math.max(0, e - calmRate[i] * dt) : 0;
      }
      else life[i] -= dt;
      ox[i] = px[i];
      oy[i] = py[i];
      px[i] += vx[i] * dt;
      py[i] += vy[i] * dt;
    }
    this.allActive = !waiting;

    this.relax();
    this.recall(dt);

    // Tank walls, and velocities from the corrected positions.
    const right = this.width - 0.5;
    const floor = this.height - 0.5;
    const friction = TUNING.fluid.floorFriction;
    const inv = 1 / dt;
    let maxV2 = 0;
    let maxE = 0;
    for (let i = 0; i < this.count; i++) {
      if (!active[i]) continue;
      if (px[i] < 0.5) px[i] = 0.5;
      else if (px[i] > right) px[i] = right;
      // Poured water enters from above; once inside, the lid holds it.
      if (!this.inTank[i]) {
        if (py[i] >= 0.5) this.inTank[i] = 1;
        else if (py[i] < -this.top) py[i] = -this.top;
      } else if (py[i] < 0.5) py[i] = 0.5;
      vx[i] = (px[i] - ox[i]) * inv;
      vy[i] = (py[i] - oy[i]) * inv;
      if (py[i] > floor) {
        py[i] = floor;
        if (vy[i] > 0) vy[i] = 0;
        vx[i] *= friction;
      }
      const v2 = vx[i] * vx[i] + vy[i] * vy[i];
      if (v2 > maxV2) maxV2 = v2;
      if (ex[i] > maxE) maxE = ex[i];
    }

    this.removeSpent();

    const still = 2.5 * this.unit;
    if (!waiting && this.count === words && maxE < 0.01 && maxV2 < still * still) {
      if (++this.quiet > 45) this.sleeping = true;
    } else this.quiet = 0;
  }

  /** Drops transient water whose life has run out (swap with the last one). */
  private removeSpent() {
    const { life, words } = this;
    for (let i = this.count - 1; i >= words; i--) {
      if (life[i] > 0) continue;
      const last = --this.count;
      if (i === last) continue;
      for (const a of [this.px, this.py, this.vx, this.vy, this.ox, this.oy, this.hx, this.hy, this.ex, this.calmRate, this.life])
        a[i] = a[last];
      this.inTank[i] = this.inTank[last];
      this.accent[i] = this.accent[last];
    }
  }

  /**
   * The memory of the word: each step, calm water moves a fraction of the way
   * home, no faster than recall.maxSpeed, so far-off water flows back steadily
   * and slows as it arrives.
   */
  private recall(dt: number) {
    const { px, py, hx, hy, ex, active } = this;
    const rate = TUNING.recall.rate;
    const maxStep = TUNING.recall.maxSpeed * this.unit * dt;
    for (let i = 0; i < this.words; i++) {
      if (!active[i]) continue;
      const calm = 1 - ex[i];
      const r = rate * calm * calm;
      if (r <= 0) continue;
      let dx = (hx[i] - px[i]) * r;
      let dy = (hy[i] - py[i]) * r;
      const d = Math.hypot(dx, dy);
      if (d > maxStep) {
        dx *= maxStep / d;
        dy *= maxStep / d;
      }
      px[i] += dx;
      py[i] += dy;
    }
  }

  private buildGrid() {
    const h = this.h;
    this.cols = Math.ceil(this.width / h) + 1;
    this.rows = Math.ceil((this.height + this.top) / h) + 1;
    const cells = this.cols * this.rows;
    if (this.cellStart.length < cells + 1) this.cellStart = new Int32Array(cells + 1);
    const start = this.cellStart;
    start.fill(0, 0, cells + 1);
    const { px, py, active, cellOf } = this;
    const n = this.count;
    for (let i = 0; i < n; i++) {
      if (!active[i]) {
        cellOf[i] = -1;
        continue;
      }
      const cx = Math.min(this.cols - 1, Math.max(0, (px[i] / h) | 0));
      const cy = Math.min(this.rows - 1, Math.max(0, ((py[i] + this.top) / h) | 0));
      const cell = cy * this.cols + cx;
      cellOf[i] = cell;
      start[cell + 1]++;
    }
    for (let c = 0; c < cells; c++) start[c + 1] += start[c];
    const fill = this.cellItems;
    const cursor = start.slice(0, cells);
    for (let i = 0; i < n; i++) if (cellOf[i] >= 0) fill[cursor[cellOf[i]]++] = i;
  }

  /** Fills the scratch arrays with i's neighbours; returns how many. */
  private neighbours(i: number) {
    const { px, py, cellOf, cellStart, cellItems, cols, rows, h } = this;
    const cell = cellOf[i];
    if (cell < 0) return 0;
    const cx = cell % cols;
    const cy = (cell / cols) | 0;
    const xi = px[i];
    const yi = py[i];
    const h2 = h * h;
    let k = 0;
    for (let gy = Math.max(0, cy - 1); gy <= Math.min(rows - 1, cy + 1); gy++) {
      for (let gx = Math.max(0, cx - 1); gx <= Math.min(cols - 1, cx + 1); gx++) {
        const c = gy * cols + gx;
        for (let s = cellStart[c], e = cellStart[c + 1]; s < e; s++) {
          const j = cellItems[s];
          if (j === i) continue;
          const dx = px[j] - xi;
          const dy = py[j] - yi;
          const r2 = dx * dx + dy * dy;
          if (r2 >= h2 || r2 < 1e-8) continue;
          const r = Math.sqrt(r2);
          this.nb[k] = j;
          this.nq[k] = r / h;
          this.nx[k] = dx / r;
          this.ny[k] = dy / r;
          if (++k === this.nb.length) return k;
        }
      }
    }
    return k;
  }

  /** Double density relaxation with viscosity. */
  private relax() {
    this.buildGrid();
    const { px, py, ox, oy, hx, hy, ex, active, h, rho0, nb, nq, nx, ny, words } = this;
    const stiff = TUNING.fluid.stiffness;
    const near = TUNING.fluid.nearStiffness;
    const cohesion = TUNING.fluid.cohesion;
    const visc = TUNING.fluid.viscosity * 0.5;
    const maxD = 0.5 * h;
    const away = 1 / (2.5 * this.spacing);
    for (let i = 0; i < this.count; i++) {
      if (!active[i]) continue;
      // Water resting in its letter holds the word's shape; the liquid takes over once it moves.
      let fluid = 1;
      if (i < words) {
        const off = Math.hypot(px[i] - hx[i], py[i] - hy[i]) * away - 0.2;
        fluid = Math.max(ex[i], Math.min(1, off));
        if (fluid <= 0.02) continue;
      }
      const k = this.neighbours(i);
      if (k === 0) continue;
      let rho = 0;
      let rhoN = 0;
      for (let j = 0; j < k; j++) {
        const q = 1 - nq[j];
        rho += q * q;
        rhoN += q * q * q;
      }
      let p = stiff * (rho - rho0) * fluid;
      if (p < 0) p *= cohesion;
      const pn = near * rhoN * fluid;
      let dx = 0;
      let dy = 0;
      for (let j = 0; j < k; j++) {
        const q = 1 - nq[j];
        let d = (p * q + pn * q * q) * h * 0.5;
        if (d > maxD) d = maxD;
        else if (d < -maxD) d = -maxD;
        const jj = nb[j];
        // Viscosity: pull this step's motion of neighbours towards each other, so water moves in streams.
        const v = visc * q * fluid;
        const mx = (px[jj] - ox[jj] - (px[i] - ox[i])) * v;
        const my = (py[jj] - oy[jj] - (py[i] - oy[i])) * v;
        const ddx = d * nx[j] - mx;
        const ddy = d * ny[j] - my;
        px[jj] += ddx;
        py[jj] += ddy;
        dx -= ddx;
        dy -= ddy;
      }
      px[i] += dx;
      py[i] += dy;
    }
  }

  /** Disturbs word water (gravity in, memory out). Transients are always disturbed. */
  private disturb(i: number, amount: number, calmRate = 1 / TUNING.recall.calm) {
    if (i >= this.words) return;
    if (amount > this.ex[i]) this.ex[i] = Math.min(1, amount);
    this.calmRate[i] = Math.min(this.calmRate[i], calmRate);
    if (this.ex[i] < 0.02) this.calmRate[i] = calmRate;
  }

  /** A drag through the water with velocity (vx, vy) px/s: the water is carried and flung. */
  push(x: number, y: number, vx: number, vy: number, radius: number) {
    let speed = Math.hypot(vx, vy);
    if (speed < 20) return;
    const cap = TUNING.pointer.maxSpeed * this.unit;
    if (speed > cap) {
      vx *= cap / speed;
      vy *= cap / speed;
      speed = cap;
    }
    const { px, py, active } = this;
    const r2 = radius * radius;
    const amount = TUNING.pointer.push;
    const stir = Math.min(1, speed / (900 * this.unit)) * TUNING.pointer.disturb;
    let touched = false;
    for (let i = 0; i < this.count; i++) {
      if (!active[i]) continue;
      const dx = px[i] - x;
      const dy = py[i] - y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r2) continue;
      const d = Math.sqrt(d2);
      let f = 1 - d / radius;
      f *= f;
      const out = d > 1e-3 ? (speed * 0.2 * f) / d : 0;
      this.vx[i] += (vx * amount - this.vx[i]) * f + dx * out;
      this.vy[i] += (vy * amount - this.vy[i]) * f + dy * out;
      this.disturb(i, Math.min(1, f * 2) * stir);
      touched = true;
    }
    if (touched) this.wake();
  }

  /** A tap: throws the nearby water outward and up. */
  splash(x: number, y: number, radius: number) {
    const { px, py, active } = this;
    const reach = radius * 1.3;
    const r2 = reach * reach;
    const out = TUNING.pointer.splash * this.unit;
    const lift = TUNING.pointer.splashLift * this.unit;
    let touched = false;
    for (let i = 0; i < this.count; i++) {
      if (!active[i]) continue;
      const dx = px[i] - x;
      const dy = py[i] - y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r2) continue;
      const d = Math.sqrt(d2) || 1;
      let f = 1 - d / reach;
      f *= f;
      const kick = 0.9 + Math.random() * 0.2;
      this.vx[i] += (dx / d) * out * f * kick - this.gx * lift * f;
      this.vy[i] += (dy / d) * out * f * kick - this.gy * lift * f;
      this.disturb(i, 0.6 + 0.4 * f);
      touched = true;
    }
    if (touched) this.wake();
  }

  /** A held pointer: draws the water within `radius` towards (x, y). */
  attract(x: number, y: number, radius: number, dt: number) {
    const { px, py, active } = this;
    const r2 = radius * radius;
    const pull = TUNING.gestures.holdStrength * this.unit * dt;
    let touched = false;
    for (let i = 0; i < this.count; i++) {
      if (!active[i]) continue;
      const dx = x - px[i];
      const dy = y - py[i];
      const d2 = dx * dx + dy * dy;
      if (d2 >= r2 || d2 < 1) continue;
      const d = Math.sqrt(d2);
      const f = 1 - d / radius;
      const a = (pull * (0.35 + f)) / d;
      const keep = 1 - Math.min(0.5, 6 * dt * f); // a little drag, so it gathers instead of orbiting
      this.vx[i] = this.vx[i] * keep + dx * a;
      this.vy[i] = this.vy[i] * keep + dy * a;
      this.disturb(i, 0.35 + 0.4 * f);
      touched = true;
    }
    if (touched) this.wake();
  }

  /** A fast swipe: the word lets go and pools on the floor, rests, then climbs back. */
  collapse(dirX: number) {
    const shove = 220 * this.unit;
    const { poolTime, climbTime } = TUNING.gestures;
    for (let i = 0; i < this.words; i++) {
      if (!this.active[i]) continue;
      this.ex[i] = 1;
      this.hold[i] = poolTime * (0.9 + Math.random() * 0.2);
      this.calmRate[i] = 1 / climbTime;
      this.vx[i] += dirX * shove * (0.6 + Math.random() * 0.8);
    }
    this.wake();
  }

  /** Points gravity along (gx, gy), and lets a strong tilt pull the word loose. */
  setGravity(gx: number, gy: number, loosen: number) {
    this.gx = gx;
    this.gy = gy;
    if (loosen <= 0.01) return;
    for (let i = 0; i < this.words; i++) if (this.active[i]) this.disturb(i, loosen);
    this.wake();
  }

  /** Turns sampled text into falling transient water. Returns how many particles were added. */
  dissolve(t: Targets) {
    const { lift, life, lifeJitter } = TUNING.dissolve;
    let added = 0;
    for (let k = 0; k < t.count && this.count < this.capacity; k++) {
      const i = this.count++;
      this.px[i] = this.hx[i] = t.hx[k];
      this.py[i] = this.hy[i] = t.hy[k];
      this.vx[i] = (Math.random() - 0.5) * 30 * this.unit;
      this.vy[i] = -lift * this.unit * (0.5 + Math.random());
      this.ex[i] = 1;
      this.life[i] = life + Math.random() * lifeJitter;
      this.active[i] = 1;
      this.inTank[i] = t.hy[k] >= 0 ? 1 : 0;
      this.accent[i] = 0;
      added++;
    }
    if (added) this.wake();
    return added;
  }

  wake() {
    this.sleeping = false;
    this.quiet = 0;
  }

  /** Stirs everything a little; used once at startup to time a busy step. */
  jostle() {
    const v = this.spacing * 40;
    for (let i = 0; i < this.words; i++) {
      this.vx[i] = (Math.random() - 0.5) * v;
      this.vy[i] = (Math.random() - 0.5) * v;
      this.ex[i] = 0.4;
    }
    this.wake();
  }

  /**
   * Writes x, y, accent, settled (how firmly a particle sits in its letter,
   * 0–1) and weight (fades transient water out) per particle. Returns the count.
   */
  writeInstances(out: Float32Array) {
    const { px, py, hx, hy, ex, active, accent, life, words } = this;
    const s2 = 1 / (this.spacing * this.spacing * 4);
    const fade = 1 / TUNING.dissolve.fade;
    let k = 0;
    for (let i = 0; i < this.count; i++) {
      if (!active[i]) continue;
      out[k++] = px[i];
      out[k++] = py[i];
      out[k++] = accent[i];
      if (i < words) {
        const dx = px[i] - hx[i];
        const dy = py[i] - hy[i];
        const calm = 1 - ex[i];
        out[k++] = calm * calm * Math.exp(-(dx * dx + dy * dy) * s2);
        out[k++] = 1;
      } else {
        out[k++] = 0;
        out[k++] = Math.min(1, life[i] * fade);
      }
    }
    return k / 5;
  }
}
