/**
 * Reads text's real layout from the DOM (the h1, or a copy of a form
 * field) so the pool floor can show exactly the same letters in exactly
 * the same places.
 */

type Glyph = { ch: string; x: number; baseline: number; accent: boolean };

export type WordLayout = {
  glyphs: Glyph[];
  font: string;
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

/**
 * Draws laid-out text into a canvas at `scale` px per CSS px, on black so
 * every channel is plain coverage: the logo's letters in red, its accent
 * in green (for the pool floor), or everything white (for a message).
 */
export function drawText(layouts: WordLayout[], width: number, height: number, scale: number, mode: "floor" | "message") {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.globalCompositeOperation = "lighter";
  ctx.textBaseline = "alphabetic";
  for (const layout of layouts) {
    ctx.font = layout.font;
    for (const g of layout.glyphs) {
      ctx.fillStyle = mode === "message" ? "#fff" : g.accent ? "#0f0" : "#f00";
      ctx.fillText(g.ch, g.x, g.baseline);
    }
  }
  return canvas;
}

/** The box the glyphs occupy (approximate: from each glyph's baseline and the font size). */
export function boundsOf(layout: WordLayout) {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const g of layout.glyphs) {
    left = Math.min(left, g.x);
    right = Math.max(right, g.x + layout.fontSize * 0.6);
    top = Math.min(top, g.baseline - layout.fontSize * 0.75);
    bottom = Math.max(bottom, g.baseline + layout.fontSize * 0.2);
  }
  return { left, right, top, bottom };
}
