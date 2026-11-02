/**
 * Reads the real h1's layout and turns it into what the water needs: a
 * crisp mask of the letters, and a set of resting places ("homes") for the
 * particles, packed evenly through every stroke, hairlines included.
 */

type Glyph = { ch: string; x: number; baseline: number; accent: boolean };

export type WordLayout = {
  glyphs: Glyph[];
  font: string;
  fontSize: number;
};

export type Targets = {
  hx: Float32Array;
  hy: Float32Array;
  accent: Uint8Array;
  count: number;
  /** Rest distance between neighbours, CSS px. */
  spacing: number;
  /** Particles per CSS px² inside the letters. */
  density: number;
  fontSize: number;
};

/** Font shorthand for canvas from the h1's computed style. */
function fontOf(el: Element) {
  const s = getComputedStyle(el);
  return `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
}

/** Waits for the h1's font, so the letters are drawn in it and not a fallback. */
export async function loadFont(h1: HTMLElement) {
  if (!document.fonts) return;
  const font = fontOf(h1);
  await Promise.race([
    document.fonts.load(font, h1.textContent ?? "").catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);
}

/**
 * Positions of every character, relative to `frame`, measured from the DOM
 * so kerning and letter spacing match the h1 exactly.
 */
export function measureWord(h1: HTMLElement, frame: HTMLElement): WordLayout {
  const origin = frame.getBoundingClientRect();
  const font = fontOf(h1);
  const fontSize = parseFloat(getComputedStyle(h1).fontSize) || 64;
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = font;
  const metrics = probe.measureText("e");
  const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || fontSize * 0.8;

  const glyphs: Glyph[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const accent = node.parentElement !== h1 && !!node.parentElement?.closest("[data-water-accent]");
    const text = node.data;
    for (let i = 0; i < text.length; i++) {
      if (!text[i].trim()) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      glyphs.push({ ch: text[i], x: rect.left - origin.left, baseline: rect.top - origin.top + ascent, accent });
    }
  }
  range.detach?.();
  return { glyphs, font, fontSize };
}

/** Draws the word into a canvas at `scale` px per CSS px: letters white, the accent red. */
export function drawWord(layout: WordLayout, width: number, height: number, scale: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: scale === 1 })!;
  ctx.scale(scale, scale);
  ctx.font = layout.font;
  ctx.textBaseline = "alphabetic";
  for (const g of layout.glyphs) {
    ctx.fillStyle = g.accent ? "#ff0000" : "#ffffff";
    ctx.fillText(g.ch, g.x, g.baseline);
  }
  return canvas;
}

/**
 * Packs about `budget` particles into the letters with an even, random
 * spacing (Poisson disk over the inked pixels). Every inked pixel ends up
 * within one spacing of a particle, so thin strokes are never left empty.
 */
export function sampleTargets(layout: WordLayout, width: number, height: number, budget: number, minSpacing: number): Targets {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const data = drawWord(layout, w, h, 1).getContext("2d")!.getImageData(0, 0, w, h).data;

  let area = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 127) area++;
  const inked = new Int32Array(area);
  for (let i = 3, k = 0; i < data.length; i += 4) if (data[i] > 127) inked[k++] = (i - 3) >> 2;

  // Shuffle once; each pass below walks the same random order.
  for (let i = inked.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = inked[i];
    inked[i] = inked[j];
    inked[j] = t;
  }

  // Random sequential packing reaches about 0.7·area/d² points.
  let spacing = Math.max(minSpacing, Math.sqrt((0.7 * Math.max(area, 1)) / budget));
  let result: Targets | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    result = poisson(inked, data, w, h, spacing, area, layout.fontSize);
    if (result.count <= budget * 1.15 || spacing <= minSpacing) break;
    spacing *= Math.sqrt(result.count / budget);
  }
  return result!;
}

function poisson(inked: Int32Array, data: Uint8ClampedArray, w: number, h: number, d: number, area: number, fontSize: number): Targets {
  const cell = d / Math.SQRT2;
  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  const grid = new Int32Array(cols * rows).fill(-1);
  const max = Math.ceil((0.9 * area) / (d * d)) + 16;
  const hx = new Float32Array(max);
  const hy = new Float32Array(max);
  const accent = new Uint8Array(max);
  const d2 = d * d;
  let n = 0;

  for (let k = 0; k < inked.length && n < max; k++) {
    const p = inked[k];
    const x = (p % w) + Math.random();
    const y = ((p / w) | 0) + Math.random();
    const cx = (x / cell) | 0;
    const cy = (y / cell) | 0;
    let free = true;
    for (let gy = Math.max(0, cy - 2); free && gy <= Math.min(rows - 1, cy + 2); gy++) {
      for (let gx = Math.max(0, cx - 2); gx <= Math.min(cols - 1, cx + 2); gx++) {
        const q = grid[gy * cols + gx];
        if (q >= 0) {
          const dx = hx[q] - x;
          const dy = hy[q] - y;
          if (dx * dx + dy * dy < d2) {
            free = false;
            break;
          }
        }
      }
    }
    if (!free) continue;
    grid[cy * cols + cx] = n;
    hx[n] = x;
    hy[n] = y;
    accent[n] = data[p * 4 + 1] < 128 ? 1 : 0; // the accent is drawn red: no green
    n++;
  }

  return {
    hx: hx.subarray(0, n),
    hy: hy.subarray(0, n),
    accent: accent.subarray(0, n),
    count: n,
    spacing: d,
    density: n / Math.max(area, 1),
    fontSize,
  };
}
