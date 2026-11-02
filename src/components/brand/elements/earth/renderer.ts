import { freeTarget, makeTarget, makeTexture, NOISE_GLSL, Program, upload, type Target } from "../gl";
import { TUNING } from "./tuning";

/**
 * The garden on the GPU (WebGL2):
 *
 * - The raked garden itself is drawn analytically at full resolution: long
 *   waving lines, rings around the wordmark, the letters pressed in (from a
 *   blurred mask of the word), and the accent as a stone.
 * - Everything the visitor does lives in a disturbance field (R = height
 *   change, G = how much of the pressed message survives), which slowly
 *   settles back to zero, faster in the wind.
 * - Flying grains and pebbles are point sprites drawn on top, with shadows.
 *
 * Coordinates are CSS px from the canvas's top-left, y down, throughout;
 * heights are CSS px too.
 */

export type Colors = { base: number[]; color: number[]; accent: number[] };
export type Rect = { x: number; y: number; w: number; h: number };

export type Op =
  | { kind: "rake"; x0: number; y0: number; x1: number; y1: number; half: number; depth: number; berm: number }
  | { kind: "crater"; x: number; y: number; radius: number; depth: number; rim: number; flatten: number }
  | { kind: "stamp"; rect: Rect };

export type Garden = {
  /** The rings' pill around the word: centre and half size, and its corner radius. */
  box: [number, number, number, number];
  radius: number;
  margin: number;
  rings: number;
  period: number;
  amp: number;
  wave: number;
  waveLength: number;
  depth: number;
  rim: number;
  stone: number;
};

/** Per sprite: x, y, height above the sand, size, then kind (0 grain, 1 pebble), alpha, angle, aspect. */
export const SPRITE_FLOATS = 8;

const MAX_OPS = 24;

/** The raked garden's height at any point (shared by the passes that need it). */
const GARDEN = `
uniform sampler2D uWord;
uniform vec4 uWordRect;
uniform vec4 uBox;
uniform vec4 uRake;
uniform vec4 uRing;
uniform vec4 uWordShape;
uniform vec4 uWind;
uniform vec2 uShift;
${NOISE_GLSL}

// Gusts: soft patches stretched along the wind, travelling with it.
float gust(vec2 p) {
  vec2 d = uWind.xy;
  vec2 q = vec2(dot(p, d), dot(p, vec2(-d.y, d.x)));
  q.x -= uWind.w * ${TUNING.wind.speed.toFixed(1)};
  return noise(q * vec2(1.0 / 260.0, 1.0 / 80.0)) * 0.65 + noise(q * vec2(1.0 / 95.0, 1.0 / 32.0) + 17.0) * 0.35;
}

float sdPill(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// R = letters (soft-edged), G = a wider blur of them (the rim), B = the accent stone's roundness.
vec4 wordAt(vec2 p) {
  vec2 uv = (p - uShift - uWordRect.xy) / uWordRect.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture(uWord, uv);
}

float rake(vec2 p) {
  float period = uRake.x;
  float r = sdPill(p - uBox.xy - uShift, uBox.zw, uRing.x);
  float margin = uRing.y;
  float zone = margin + uRing.z * period;
  float ring = cos(6.2831853 * (r - margin) / period);
  float y = p.y + uRake.z * sin(6.2831853 * p.x / uRake.w);
  float line = cos(6.2831853 * y / period);
  float g = mix(ring, line, smoothstep(zone - 0.15 * period, zone + 0.15 * period, r));
  float inner = smoothstep(margin - 0.6 * period, margin + 0.1 * period, r);
  // The wind softens the grooves where it gusts.
  float soft = 1.0 - 0.4 * uWind.z * smoothstep(0.35, 0.8, gust(p));
  return uRake.y * g * inner * soft;
}

float garden(vec2 p, out vec4 w) {
  w = wordAt(p);
  float h = mix(rake(p), -uWordShape.x, w.r) + uWordShape.y * max(w.g - w.r, 0.0);
  if (w.b > 0.2) h = max(h, uWordShape.z * sqrt(clamp((w.b - 0.2) / 0.7, 0.0, 1.0)));
  return h;
}
`;

// The disturbance field: row 0 is the bottom of the screen (gl_FragCoord), as p.y counts down.
const SIM_COORD = `vec2 p = vec2(gl_FragCoord.x, uSimSize.y - gl_FragCoord.y) * uCell;`;

const DISTURB = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uSimSize;
uniform vec2 uCell;
uniform vec4 uOpA[${MAX_OPS}];
uniform vec4 uOpB[${MAX_OPS}];
uniform int uOpCount;
${GARDEN}
out vec4 outColor;
void main() {
  vec4 s = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);
  ${SIM_COORD}
  vec4 w;
  float base = garden(p, w);
  float d = s.r;
  float keep = s.g;
  for (int i = 0; i < ${MAX_OPS}; i++) {
    if (i >= uOpCount) break;
    vec4 a = uOpA[i];
    vec4 b = uOpB[i];
    if (b.x < 0.5) {
      // A rake pulled from a.xy to a.zw: tines carve grooves along it, the sand it moves heaps up beside it.
      vec2 ab = a.zw - a.xy;
      float len = max(length(ab), 1e-3);
      vec2 dir = ab / len;
      vec2 q = p - a.xy;
      float t = dot(q, dir);
      float across = dot(q, vec2(-dir.y, dir.x));
      float along = smoothstep(-1.0, 0.5, t) * (1.0 - smoothstep(len - 0.5, len + 1.0, t));
      float inside = along * (1.0 - smoothstep(b.y - 1.2, b.y + 0.6, abs(across)));
      float spacing = 2.0 * b.y / ${TUNING.rake.tines.toFixed(1)};
      float groove = -b.z * cos(6.2831853 * across / spacing);
      d = mix(d, groove - base, inside);
      float k = (abs(across) - b.y - 1.6) / 1.4;
      d += b.w * exp(-k * k) * along * (1.0 - inside) * 0.3;
      keep *= 1.0 - inside;
    } else if (b.x < 1.5) {
      // A crater (or a pebble's dent): a smooth bowl, and a rim of the sand pushed out.
      float r = length(p - a.xy) / a.z;
      float bowl = -b.y * pow(max(1.0 - r * r, 0.0), 2.0);
      float inside = 1.0 - smoothstep(0.55, 1.0, r);
      float rim = b.z * exp(-pow((r - 1.15) / 0.32, 2.0));
      d = mix(d, bowl - base * b.w, inside) + rim;
      keep *= 1.0 - inside * 0.9;
    } else {
      // A new message: it fully survives (for now) inside its box.
      vec2 q = p - a.xy;
      if (q.x >= 0.0 && q.y >= 0.0 && q.x <= a.z && q.y <= a.w) keep = 1.0;
    }
  }
  outColor = vec4(d, keep, 0.0, 1.0);
}`;

const SETTLE = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uSimSize;
uniform vec2 uCell;
uniform float uDt;
uniform vec4 uSettle;
uniform float uErode;
${GARDEN}
out vec4 outColor;
vec4 at(ivec2 c) {
  return texelFetch(uState, clamp(c, ivec2(0), textureSize(uState, 0) - 1), 0);
}
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  ${SIM_COORD}
  vec4 here = at(c);
  vec4 lap = at(c + ivec2(1, 0)) + at(c - ivec2(1, 0)) + at(c + ivec2(0, 1)) + at(c - ivec2(0, 1)) - 4.0 * here;
  float g = gust(p);
  float windy = clamp(uWind.z * (0.25 + g), 0.0, 1.0);
  // Sand slowly slumps (softens) and settles back to the raked garden; the wind hurries both.
  float blur = min(mix(uSettle.z, uSettle.w, windy) * uDt, 0.2);
  float d = (here.r + blur * lap.r) * exp(-uDt / mix(uSettle.x, uSettle.y, windy));
  float keep = here.g + blur * 0.5 * lap.g;
  // The wind erases a pressed message unevenly, gust by gust.
  keep -= uDt * uErode * (0.3 + 1.4 * g * g);
  outColor = vec4(d, clamp(keep, 0.0, 1.0), 0.0, 1.0);
}`;

// Slopes of the disturbances, for smooth lighting: (d/dx, d/dy) with y down, height, survival.
const GRADIENT = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uCell;
out vec4 outColor;
float at(ivec2 c) {
  return texelFetch(uState, clamp(c, ivec2(0), textureSize(uState, 0) - 1), 0).r;
}
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec4 h = texelFetch(uState, c, 0);
  float dx = (at(c + ivec2(1, 0)) - at(c - ivec2(1, 0))) / (2.0 * uCell.x);
  float dy = (at(c - ivec2(0, 1)) - at(c + ivec2(0, 1))) / (2.0 * uCell.y);
  outColor = vec4(dx, dy, h.r, h.g);
}`;

const COPY = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uSimSize;
out vec4 outColor;
void main() {
  ivec2 size = textureSize(uState, 0);
  vec2 f = gl_FragCoord.xy / uSimSize;
  outColor = texelFetch(uState, clamp(ivec2(f * vec2(size)), ivec2(0), size - 1), 0);
}`;

// Separable Gaussian with a different width per output channel; uSelect picks the inputs.
const BLUR = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform mat4 uSelect;
uniform vec2 uDir;
uniform vec3 uSigma;
out vec4 outColor;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 m = textureSize(uSrc, 0) - 1;
  float widest = max(uSigma.x, max(uSigma.y, uSigma.z));
  int radius = int(min(ceil(widest * 3.0), 48.0));
  vec3 k = -0.5 / max(uSigma * uSigma, vec3(1e-4));
  vec3 sum = vec3(0.0);
  vec3 total = vec3(0.0);
  for (int i = -48; i <= 48; i++) {
    if (i < -radius || i > radius) continue;
    vec4 s = uSelect * texelFetch(uSrc, clamp(c + ivec2(uDir) * i, ivec2(0), m), 0);
    vec3 w = exp(float(i * i) * k);
    sum += s.xyz * w;
    total += w;
  }
  outColor = vec4(sum / total, 1.0);
}`;

const SAND = `#version 300 es
precision highp float;
uniform sampler2D uGrad;
uniform sampler2D uMessage;
uniform vec4 uMessageRect;
uniform vec3 uMessageShape;
uniform vec2 uSize;
uniform vec2 uRes;
uniform vec2 uSimSize;
uniform vec3 uLight;
uniform vec4 uShade;
uniform vec3 uGrain;
uniform vec3 uBase;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uVignette;
uniform float uTime;
${GARDEN}
out vec4 outColor;

// Smooth (cubic B-spline) sampling from four bilinear taps, so the lighting shows no grid.
vec4 smoothSample(sampler2D t, vec2 uv, vec2 size) {
  vec2 st = uv * size - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 h0 = (i - 0.5 + w1 / g0) / size;
  vec2 h1 = (i + 1.5 + w3 / g1) / size;
  return g0.y * (g0.x * texture(t, h0) + g1.x * texture(t, vec2(h1.x, h0.y)))
       + g1.y * (g0.x * texture(t, vec2(h0.x, h1.y)) + g1.x * texture(t, h1));
}

vec4 messageAt(vec2 p) {
  vec2 uv = (p - uMessageRect.xy) / uMessageRect.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture(uMessage, uv);
}

// The garden plus the pressed message (softer and shallower as the wind erases it).
float surface(vec2 p, float keep, out vec4 w, out float pressed) {
  float h = garden(p, w);
  vec4 m = messageAt(p);
  float press = uMessageShape.z * keep;
  pressed = mix(m.g * 0.85, m.r, keep) * press;
  return mix(h, -uMessageShape.x, pressed) + uMessageShape.y * max(m.g - m.r, 0.0) * press;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * (uSize / uRes);
  float e = uSize.x / uRes.x;

  vec4 dist = smoothSample(uGrad, vec2(p.x / uSize.x, 1.0 - p.y / uSize.y), uSimSize);
  float keep = clamp(dist.a, 0.0, 1.0);
  vec4 w;
  vec4 wx;
  vec4 wy;
  float pressed;
  float px;
  float h0 = surface(p, keep, w, pressed);
  float hx = surface(p + vec2(e, 0.0), keep, wx, px);
  float hy = surface(p + vec2(0.0, e), keep, wy, px);
  vec2 slope = vec2(hx - h0, hy - h0) / e + dist.xy;

  // Fine grains, smoothed away where the sand is pressed flat.
  float packed = max(w.r, pressed);
  float stone = smoothstep(0.18, 0.3, w.b);
  float grainy = (1.0 - 0.8 * packed) * (1.0 - stone);
  vec2 gp = p / uGrain.x;
  float n0 = noise(gp);
  slope += vec2(noise(gp + vec2(e / uGrain.x, 0.0)) - n0, noise(gp + vec2(0.0, e / uGrain.x)) - n0) / e * uGrain.y * grainy;

  vec3 n = normalize(vec3(-slope * uShade.z, 1.0));
  float facing = dot(n, uLight);

  // Dark volcanic sand, each grain a little different; pressed sand is darker, the stone is the accent.
  ivec2 cell = ivec2(floor(gp));
  float speck = hash(cell);
  // The wordmark's letters are packed darker so they read; the message only by its edges, to keep the form above it clear.
  vec3 sand = uBase * vec3(0.95, 0.97, 1.03) * (0.8 + 0.4 * speck) * (1.0 - 0.28 * w.r - 0.05 * pressed);
  vec3 albedo = mix(sand, uAccent * 0.82, stone);

  // The stone casts a long, soft shadow away from the low sun (as far as its height allows).
  vec2 sunward = normalize(uLight.xy) * uWordShape.z * length(uLight.xy) / uLight.z;
  float block = max(wordAt(p + sunward * 0.35).b, max(wordAt(p + sunward * 0.7).b, wordAt(p + sunward).b));
  float shadow = 1.0 - 0.7 * smoothstep(0.2, 0.55, block) * (1.0 - stone);
  // The sun is low in the top left: a gentle falloff across the garden.
  vec2 v = p / uSize;
  float sun = uShade.y * (1.1 - 0.2 * dot(v, vec2(0.62, 0.38)));
  // Warm low sun, cool shade.
  vec3 col = albedo * (uShade.x * vec3(0.94, 0.97, 1.04) + sun * max(facing, 0.0) * shadow * vec3(1.05, 1.0, 0.93));

  // Sheen on pressed sand and the polished stone; rare glassy grains glint.
  vec3 halfway = normalize(uLight + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, halfway), 0.0), mix(36.0, 70.0, stone)) * mix(0.025 * packed, 0.55, stone);
  float glint = step(1.0 - uGrain.z, hash(cell + ivec2(91, 17))) * smoothstep(0.3, 0.75, facing) * grainy;
  col += uInk * (spec + glint * 0.07) * shadow;

  // Wind: faint streaks of fine sand drifting across.
  vec2 d = uWind.xy;
  vec2 q = vec2(dot(p, d), dot(p, vec2(-d.y, d.x)));
  float streak = noise(vec2((q.x - uWind.w * ${(TUNING.wind.speed * 1.6).toFixed(1)}) / 90.0, q.y / 7.0));
  col += uInk * uWind.z * ${TUNING.wind.streaks.toFixed(3)} * smoothstep(0.55, 0.95, streak) * smoothstep(0.35, 0.8, gust(p)) * grainy;

  v -= 0.5;
  col *= 1.0 - uVignette * dot(v, v) * 1.6;
  col += (hash(ivec2(gl_FragCoord.xy) + ivec2(int(uTime * 60.0) * 7919, 0)) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}`;

const SPRITE_VERT = `#version 300 es
layout(location = 0) in vec4 aA;
layout(location = 1) in vec4 aB;
uniform vec2 uSize;
uniform float uRatio;
uniform vec3 uLight;
uniform float uShadow;
out vec4 vB;
void main() {
  vec2 p = aA.xy;
  float z = aA.z;
  float size = aA.w * (1.0 + z * 0.012);
  if (uShadow > 0.5) {
    // Cast away from the low sun: further the higher it flies.
    p -= uLight.xy / uLight.z * (z + aA.w * 0.22);
    size *= 1.35;
  }
  gl_Position = vec4(p.x / uSize.x * 2.0 - 1.0, 1.0 - p.y / uSize.y * 2.0, 0.0, 1.0);
  gl_PointSize = max(1.0, size * uRatio + 1.0);
  vB = aB;
}`;

const SPRITE = `#version 300 es
precision highp float;
in vec4 vB;
uniform vec3 uLight;
uniform float uShadow;
uniform vec3 uBase;
uniform vec3 uInk;
out vec4 outColor;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float ca = cos(vB.z);
  float sa = sin(vB.z);
  vec2 r = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);
  r.y *= vB.w;
  float r2 = dot(r, r);
  if (uShadow > 0.5) {
    float a = (1.0 - smoothstep(0.15, 1.0, r2)) * (vB.x > 0.5 ? 0.5 : 0.16) * vB.y;
    outColor = vec4(0.0, 0.0, 0.0, a);
    return;
  }
  if (r2 > 1.0) discard;
  vec3 n = normalize(vec3(q, sqrt(max(1.0 - r2, 0.0)) * (vB.x > 0.5 ? 0.75 : 1.0)));
  // Grains are the sand itself; pebbles a smoother, paler grey basalt.
  vec3 albedo = vB.x > 0.5 ? mix(uBase * 1.6, vec3(0.19, 0.19, 0.2), 0.5) : uBase * vec3(0.95, 0.97, 1.03);
  vec3 col = albedo * (0.3 + 2.2 * max(dot(n, uLight), 0.0));
  vec3 halfway = normalize(uLight + vec3(0.0, 0.0, 1.0));
  col += uInk * pow(max(dot(n, halfway), 0.0), vB.x > 0.5 ? 28.0 : 14.0) * (vB.x > 0.5 ? 0.32 : 0.18);
  outColor = vec4(col, (1.0 - smoothstep(0.8, 1.0, r2)) * vB.y);
}`;

export class GardenRenderer {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private spriteVao: WebGLVertexArrayObject;
  private spriteBuffer: WebGLBuffer;
  private disturbP: Program;
  private settleP: Program;
  private gradientP: Program;
  private copyP: Program;
  private blurP: Program;
  private sandP: Program;
  private spriteP: Program;

  /** 32-bit float state where possible: the slow settling is too fine for half floats. */
  private format: "32f" | "16f";
  private state: Target[] = [];
  private grad: Target | null = null;
  private word: Target | null = null;
  private message: Target | null = null;
  private wordRect: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private messageRect: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private black: WebGLTexture;

  private colors: Colors = { base: [0.09, 0.09, 0.09], color: [1, 1, 1], accent: [1, 0.3, 0.2] };
  private garden: Garden | null = null;
  private shift: [number, number] = [0, 0];
  private wind = { level: 0, time: 0 };
  private settleDt = 0;
  private settleFrames = 0;
  private opA = new Float32Array(MAX_OPS * 4);
  private opB = new Float32Array(MAX_OPS * 4);

  private size = [1, 1];
  private res = [1, 1];
  private simSize = [0, 0];
  private cell = [1, 1];
  private light: number[];

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const float32 = !!gl.getExtension("EXT_color_buffer_float");
    if (!float32 && !gl.getExtension("EXT_color_buffer_half_float")) throw new Error("No float render targets");
    this.format = float32 ? "32f" : "16f";
    this.vao = gl.createVertexArray()!;
    this.disturbP = new Program(gl, DISTURB);
    this.settleP = new Program(gl, SETTLE);
    this.gradientP = new Program(gl, GRADIENT);
    this.copyP = new Program(gl, COPY);
    this.blurP = new Program(gl, BLUR);
    this.sandP = new Program(gl, SAND);
    this.spriteP = new Program(gl, SPRITE, SPRITE_VERT);
    this.black = makeTexture(gl);
    upload(gl, this.black, null);

    this.spriteVao = gl.createVertexArray()!;
    this.spriteBuffer = gl.createBuffer()!;
    gl.bindVertexArray(this.spriteVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, TUNING.grains.max * SPRITE_FLOATS * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, SPRITE_FLOATS * 4, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, SPRITE_FLOATS * 4, 16);
    gl.bindVertexArray(null);

    const [lx, ly, lz] = TUNING.light.dir;
    const l = Math.hypot(lx, ly, lz);
    this.light = [lx / l, ly / l, lz / l];
  }

  setColors(colors: Colors) {
    this.colors = colors;
  }

  /** Sizes the canvas and the disturbance field, keeping what's already there. */
  resize(cssW: number, cssH: number, pixelRatio: number) {
    const gl = this.gl;
    this.size = [cssW, cssH];
    this.res = [Math.max(1, Math.round(cssW * pixelRatio)), Math.max(1, Math.round(cssH * pixelRatio))];
    const cell = TUNING.sim.cell;
    const simW = Math.max(8, Math.ceil(cssW / cell));
    const simH = Math.max(8, Math.ceil(cssH / cell));
    this.cell = [cssW / simW, cssH / simH];
    if (simW !== this.simSize[0] || simH !== this.simSize[1]) {
      const old = this.state;
      const next = [makeTarget(gl, simW, simH, this.format), makeTarget(gl, simW, simH, this.format)];
      if (old.length) {
        for (const t of next) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
          gl.viewport(0, 0, simW, simH);
          const p = this.copyP.use();
          this.bind(0, old[0].tex);
          gl.uniform1i(p.u("uState"), 0);
          gl.uniform2f(p.u("uSimSize"), simW, simH);
          this.draw();
        }
      }
      for (const t of old) freeTarget(gl, t);
      freeTarget(gl, this.grad);
      this.state = next;
      this.grad = makeTarget(gl, simW, simH, "16f");
      this.simSize = [simW, simH];
    }
    gl.canvas.width = this.res[0];
    gl.canvas.height = this.res[1];
  }

  setGarden(garden: Garden) {
    this.garden = garden;
  }

  /** The word's mask (R letters, G accent), drawn over `rect` at `scale` px per CSS px; blurred into its shapes. */
  setWord(mask: TexImageSource, rect: Rect, scale: number, sigmas: [number, number, number]) {
    freeTarget(this.gl, this.word);
    this.word = this.blurred(mask, sigmas.map((s) => s * scale) as [number, number, number], [1, 1, 0, 0, 0, 0, 1, 0]);
    this.wordRect = rect;
  }

  /** The sent message's mask (white text) over `rect`, or null to clear it. */
  setMessage(mask: TexImageSource | null, rect: Rect, scale: number, sigmas: [number, number]) {
    freeTarget(this.gl, this.message);
    this.message = mask ? this.blurred(mask, [sigmas[0] * scale, sigmas[1] * scale, 0], [1, 1, 0, 0, 0, 0, 0, 0]) : null;
    this.messageRect = rect;
  }

  /** Where the word has moved since it was drawn (a layout change, the keyboard). */
  setShift(shift: [number, number]) {
    this.shift = shift;
  }

  /** Rakes, craters, dents and message stamps. */
  disturb(ops: Op[]) {
    const gl = this.gl;
    for (let start = 0; start < ops.length; start += MAX_OPS) {
      const batch = ops.slice(start, start + MAX_OPS);
      this.opA.fill(0);
      this.opB.fill(0);
      batch.forEach((op, i) => {
        if (op.kind === "rake") {
          this.opA.set([op.x0, op.y0, op.x1, op.y1], i * 4);
          this.opB.set([0, op.half, op.depth, op.berm], i * 4);
        } else if (op.kind === "crater") {
          this.opA.set([op.x, op.y, op.radius, 0], i * 4);
          this.opB.set([1, op.depth, op.rim, op.flatten], i * 4);
        } else {
          this.opA.set([op.rect.x, op.rect.y, op.rect.w, op.rect.h], i * 4);
          this.opB.set([2, 0, 0, 0], i * 4);
        }
      });
      const p = this.simPass(this.disturbP);
      this.gardenUniforms(p, 1);
      gl.uniform4fv(p.u("uOpA"), this.opA);
      gl.uniform4fv(p.u("uOpB"), this.opB);
      gl.uniform1i(p.u("uOpCount"), batch.length);
      this.draw();
      this.state.reverse();
    }
  }

  /** Lets the disturbances settle for `dt` seconds; `erode` is how fast the wind erases the message (per second). */
  settle(dt: number, wind: number, time: number, erode: number) {
    const gl = this.gl;
    this.wind = { level: wind, time };
    this.settleDt += dt;
    this.settleFrames++;
    // Half floats can't hold the tiny per-frame changes: settle in bigger, rarer steps there.
    if (this.format === "16f" && this.settleFrames % 4 !== 0) return;
    const s = TUNING.settle;
    const p = this.simPass(this.settleP);
    this.gardenUniforms(p, 1);
    gl.uniform1f(p.u("uDt"), this.settleDt);
    gl.uniform4f(p.u("uSettle"), s.calm, s.windy, s.blurCalm, s.blurWindy);
    gl.uniform1f(p.u("uErode"), erode);
    this.draw();
    this.state.reverse();
    this.settleDt = 0;
  }

  /** Draws the garden, then the sprites (`count` of them in `sprites`). */
  render(time: number, press: number, sprites: Float32Array, count: number) {
    const gl = this.gl;
    const g = this.grad!;
    // Slopes of the disturbances first.
    gl.bindFramebuffer(gl.FRAMEBUFFER, g.fbo);
    gl.viewport(0, 0, g.w, g.h);
    const gp = this.gradientP.use();
    this.bind(0, this.state[0].tex);
    gl.uniform1i(gp.u("uState"), 0);
    gl.uniform2f(gp.u("uCell"), this.cell[0], this.cell[1]);
    this.draw();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.res[0], this.res[1]);
    const p = this.sandP.use();
    this.bind(0, g.tex);
    gl.uniform1i(p.u("uGrad"), 0);
    this.gardenUniforms(p, 1);
    this.bind(2, this.message?.tex ?? this.black);
    gl.uniform1i(p.u("uMessage"), 2);
    const mr = this.messageRect;
    gl.uniform4f(p.u("uMessageRect"), mr.x, mr.y, mr.w, mr.h);
    const m = TUNING.message;
    gl.uniform3f(p.u("uMessageShape"), m.depth, m.rim, this.message ? press : 0);
    gl.uniform2f(p.u("uSize"), this.size[0], this.size[1]);
    gl.uniform2f(p.u("uRes"), this.res[0], this.res[1]);
    gl.uniform2f(p.u("uSimSize"), this.simSize[0], this.simSize[1]);
    gl.uniform3fv(p.u("uLight"), this.light);
    const l = TUNING.light;
    gl.uniform4f(p.u("uShade"), l.ambient, l.sun, l.relief, 0);
    const gr = TUNING.grain;
    gl.uniform3f(p.u("uGrain"), gr.size, gr.relief, gr.glint);
    gl.uniform3fv(p.u("uBase"), this.colors.base);
    gl.uniform3fv(p.u("uInk"), this.colors.color);
    gl.uniform3fv(p.u("uAccent"), this.colors.accent);
    gl.uniform1f(p.u("uVignette"), l.vignette);
    gl.uniform1f(p.u("uTime"), time);
    this.draw();

    if (count > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, sprites, 0, count * SPRITE_FLOATS);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      const sp = this.spriteP.use();
      gl.uniform2f(sp.u("uSize"), this.size[0], this.size[1]);
      gl.uniform1f(sp.u("uRatio"), this.res[0] / this.size[0]);
      gl.uniform3fv(sp.u("uLight"), this.light);
      gl.uniform3fv(sp.u("uBase"), this.colors.base);
      gl.uniform3fv(sp.u("uInk"), this.colors.color);
      gl.bindVertexArray(this.spriteVao);
      for (const shadow of [1, 0]) {
        gl.uniform1f(sp.u("uShadow"), shadow);
        gl.drawArrays(gl.POINTS, 0, count);
      }
      gl.disable(gl.BLEND);
    }
  }

  dispose() {
    const gl = this.gl;
    for (const t of this.state) freeTarget(gl, t);
    this.state = [];
    for (const t of [this.grad, this.word, this.message]) freeTarget(gl, t);
    this.grad = this.word = this.message = null;
    gl.deleteTexture(this.black);
    for (const p of [this.disturbP, this.settleP, this.gradientP, this.copyP, this.blurP, this.sandP, this.spriteP]) p.dispose();
    gl.deleteBuffer(this.spriteBuffer);
    gl.deleteVertexArray(this.spriteVao);
    gl.deleteVertexArray(this.vao);
  }

  // ---------------------------------------------------------------------------

  private draw() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private bind(unit: number, tex: WebGLTexture) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  }

  /** Reads state[0], writes state[1]. */
  private simPass(program: Program) {
    const gl = this.gl;
    const p = program.use();
    this.bind(0, this.state[0].tex);
    gl.uniform1i(p.u("uState"), 0);
    gl.uniform2f(p.u("uSimSize"), this.simSize[0], this.simSize[1]);
    gl.uniform2f(p.u("uCell"), this.cell[0], this.cell[1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.state[1].fbo);
    gl.viewport(0, 0, this.simSize[0], this.simSize[1]);
    return p;
  }

  private gardenUniforms(p: Program, unit: number) {
    const gl = this.gl;
    const g = this.garden;
    this.bind(unit, this.word?.tex ?? this.black);
    gl.uniform1i(p.u("uWord"), unit);
    const r = this.wordRect;
    gl.uniform4f(p.u("uWordRect"), r.x, r.y, r.w, r.h);
    gl.uniform2f(p.u("uShift"), this.shift[0], this.shift[1]);
    const [wx, wy] = TUNING.wind.dir;
    const wl = Math.hypot(wx, wy);
    gl.uniform4f(p.u("uWind"), wx / wl, wy / wl, this.wind.level, this.wind.time);
    if (!g) return;
    gl.uniform4f(p.u("uBox"), ...g.box);
    gl.uniform4f(p.u("uRake"), g.period, g.amp, g.wave, g.waveLength);
    gl.uniform4f(p.u("uRing"), g.radius, g.margin, g.rings, 0);
    gl.uniform4f(p.u("uWordShape"), g.depth, g.rim, g.stone, 0);
  }

  /** Uploads a mask and blurs it (two passes) into a filterable float target. */
  private blurred(mask: TexImageSource, sigmas: [number, number, number], firstSelect: number[]) {
    const gl = this.gl;
    const src = makeTexture(gl, gl.NEAREST);
    upload(gl, src, mask);
    const w = (mask as { width: number }).width;
    const h = (mask as { height: number }).height;
    const mid = makeTarget(gl, w, h, "16f");
    const out = makeTarget(gl, w, h, "16f");
    const p = this.blurP.use();
    gl.uniform1i(p.u("uSrc"), 0);
    gl.uniform3f(p.u("uSigma"), sigmas[0], sigmas[1], sigmas[2]);
    // Column-major: column j says where input channel j goes.
    const first = new Float32Array(16);
    first.set(firstSelect);
    const identity = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]);
    for (const [from, into, dir, select] of [
      [src, mid, [1, 0], first],
      [mid.tex, out, [0, 1], identity],
    ] as const) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, into.fbo);
      gl.viewport(0, 0, w, h);
      this.bind(0, from);
      gl.uniform2f(p.u("uDir"), dir[0], dir[1]);
      gl.uniformMatrix4fv(p.u("uSelect"), false, select);
      this.draw();
    }
    gl.deleteTexture(src);
    freeTarget(gl, mid);
    return out;
  }
}
