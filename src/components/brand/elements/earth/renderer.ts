import { freeTarget, makeTarget, makeTexture, NOISE_GLSL, Program, upload, type Target } from "../gl";
import { TUNING } from "./tuning";

/**
 * The garden on the GPU (WebGL2):
 *
 * - The raked garden itself is drawn analytically at full resolution:
 *   straight lines, rings around the stone, the letters pressed in (from a
 *   blurred mask of the word), the accent as a stone, and snaking streamers
 *   of fine sand blown across it.
 * - Everything that changes lives in a state field: R = height change
 *   (rakes, craters, dents), G = how much of the pressed message survives,
 *   B = how worn the raked lines are. Disturbances settle back to zero; the
 *   wind wears the lines, and the invisible rake makes them fresh again.
 * - Flying grains and pebbles are point sprites drawn on top, with shadows.
 *
 * Coordinates are CSS px from the canvas's top-left, y down, throughout;
 * heights are CSS px too.
 */

/** The sand's colour, its brightest highlights, and the stone's (the page accent). */
export type Colors = { sand: readonly number[]; high: readonly number[]; accent: readonly number[] };
export type Rect = { x: number; y: number; w: number; h: number };

export type Op =
  | { kind: "rake"; x0: number; y0: number; x1: number; y1: number; half: number; depth: number; berm: number }
  | { kind: "crater"; x: number; y: number; radius: number; depth: number; rim: number; flatten: number }
  | { kind: "stamp"; rect: Rect }
  /** The invisible rake's tines moving from (x0, y0) to (x1, y1): fresh lines behind, a little sand heaped ahead. */
  | { kind: "refresh"; x0: number; y0: number; x1: number; y1: number; half: number; heap: number; period: number }
  /** Sets how worn the lines are everywhere: around `level`, varying by `spread` over patches of `scale` px. */
  | { kind: "wear"; level: number; spread: number; scale: number };

export type Garden = {
  /** The stone: centre and radius (the rings are around it). */
  stone: [number, number, number];
  margin: number;
  rings: number;
  period: number;
  amp: number;
  depth: number;
  rim: number;
  stoneHeight: number;
};

/** Per sprite: x, y, height above the sand, size, then kind (0 grain, 1 pebble), alpha, angle, aspect. */
export const SPRITE_FLOATS = 8;

const MAX_OPS = 24;
const W = TUNING.wind;

/** The raked garden's height at any point (shared by the passes that need it). */
const GARDEN = `
uniform sampler2D uWord;
uniform vec4 uWordRect;
uniform vec4 uStone;
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
  q.x -= uWind.w * ${W.speed.toFixed(1)};
  return noise(q * vec2(1.0 / 260.0, 1.0 / 80.0)) * 0.65 + noise(q * vec2(1.0 / 95.0, 1.0 / 32.0) + 17.0) * 0.35;
}

// Streamers: ribbons of fine sand snaking along lanes across the wind (mirrored in engine.ts for the grains).
float streamers(vec2 p) {
  vec2 d = uWind.xy;
  float u = dot(p, d);
  float v = dot(p, vec2(-d.y, d.x));
  float k = floor(v / ${W.lane.toFixed(1)});
  float sum = 0.0;
  // Its own lane and the nearer neighbour (a ribbon never strays further).
  float other = fract(v / ${W.lane.toFixed(1)}) < 0.5 ? k - 1.0 : k + 1.0;
  for (int j = 0; j < 2; j++) {
    float lane = j == 0 ? k : other;
    ivec2 id = ivec2(int(lane), 7);
    float h1 = hash(id);
    float h2 = hash(id + ivec2(0, 6));
    float travel = u - uWind.w * ${W.streamerSpeed.toFixed(1)} * (0.8 + 0.4 * h1);
    float centre = (lane + 0.5) * ${W.lane.toFixed(1)} + (h2 - 0.5) * ${(W.lane * 0.5).toFixed(1)}
      + 22.0 * sin(travel / 170.0 + h1 * 6.2831853) + 8.0 * sin(travel / 61.0 + h2 * 6.2831853);
    float width = 4.0 + 7.0 * noise(vec2(travel / 110.0, lane * 1.7));
    float x = (v - centre) / width;
    float packet = smoothstep(0.42, 0.78, noise(vec2(travel / 240.0, lane * 3.1)));
    sum += exp(-x * x) * packet;
  }
  return sum * (0.3 + 0.7 * uWind.z);
}

// R = letters (soft-edged), G = a wider blur of them (the rim), B = the accent stone's roundness.
vec4 wordAt(vec2 p) {
  vec2 uv = (p - uShift - uWordRect.xy) / uWordRect.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture(uWord, uv);
}

float stoneHeight(float b) {
  return uWordShape.z * sqrt(clamp((b - 0.2) / 0.7, 0.0, 1.0));
}

// Just the pressed letters, their rim and the stone (for cast shadows).
float wordHeight(vec4 w) {
  float h = -uWordShape.x * w.r + uWordShape.y * max(w.g - w.r, 0.0);
  return w.b > 0.2 ? max(h, stoneHeight(w.b)) : h;
}

// Raked lines, and rings around the stone; worn lines are shallower. Drawn by hand, they're
// never quite even: the lines wander a little, ridges rise and fall along their length, and
// the tines leave fine streaks.
//
// The slow, smooth part of that (how the lines wander, how high the ridges are) changes too
// little between neighbouring pixels to matter for their slopes, so it's worked out once per
// pixel: x = wander, y = ridge height, z = the phase of the tines' streaks.
vec3 handOf(vec2 p) {
  float period = uRake.x;
  float wander = (noise(p * vec2(1.0 / 280.0, 1.0 / 520.0)) - 0.5) * 0.7 * period
    + (noise(p * vec2(1.0 / 90.0, 1.0 / 240.0) + 31.0) - 0.5) * 0.16 * period;
  float vary = 0.75 + 0.5 * noise(vec2(p.x / 120.0, (p.y + wander) / period * 0.9 + 0.5));
  // The tines' fine streaks drift in and out of step along the lines.
  float phase = noise(p * vec2(1.0 / 70.0, 1.0 / 30.0) + 5.0) * 12.566;
  return vec3(wander, vary, phase);
}

float rake(vec2 p, float wear, vec3 hand) {
  float period = uRake.x;
  float wander = hand.x;
  float r = length(p - uStone.xy - uShift) - uStone.z;
  float margin = uRing.y;
  float zone = margin + uRing.z * period;
  float ring = cos(6.2831853 * (r - margin + 0.4 * wander) / period);
  float y = p.y + wander;
  float line = cos(6.2831853 * y / period);
  float straight = smoothstep(zone - 0.15 * period, zone + 0.15 * period, r);
  float g = mix(ring, line, straight);
  // Rounded ridges, broad soft troughs.
  g = g > 0.0 ? pow(g, 0.8) : -pow(-g, 1.25);
  float inner = smoothstep(margin - 0.6 * period, margin + 0.1 * period, r);
  float streak = (sin(y * 3.7 + hand.z) + sin(y * 2.3 - 1.7 * hand.z)) * 0.07 * straight;
  return (uRake.y * g * hand.y + streak) * inner * (1.0 - uRake.z * wear);
}

float garden(vec2 p, float wear, vec3 hand, out vec4 w) {
  w = wordAt(p);
  float h = mix(rake(p, wear, hand), -uWordShape.x, w.r) + uWordShape.y * max(w.g - w.r, 0.0);
  if (w.b > 0.2) h = max(h, stoneHeight(w.b));
  return h;
}
`;

// The state field: row 0 is the bottom of the screen (gl_FragCoord), as p.y counts down.
const SIM_COORD = `vec2 p = vec2(gl_FragCoord.x, uSimSize.y - gl_FragCoord.y) * uCell;`;

const DISTURB = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uSimSize;
uniform vec2 uCell;
uniform vec4 uOpA[${MAX_OPS}];
uniform vec4 uOpB[${MAX_OPS}];
uniform int uOpCount;
uniform bool uNeedBase;
${GARDEN}
out vec4 outColor;
void main() {
  vec4 s = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);
  ${SIM_COORD}
  float d = s.r;
  float keep = s.g;
  float wear = s.b;
  // Only the visitor's rakes and craters replace the garden's own shape (the invisible rake, every frame, doesn't).
  vec4 w;
  float base = uNeedBase ? garden(p, wear, handOf(p), w) : 0.0;
  for (int i = 0; i < ${MAX_OPS}; i++) {
    if (i >= uOpCount) break;
    vec4 a = uOpA[i];
    vec4 b = uOpB[i];
    if (b.x < 0.5 || (b.x > 2.5 && b.x < 3.5)) {
      // Along a segment from a.xy to a.zw: t along it, across it.
      vec2 ab = a.zw - a.xy;
      float len = max(length(ab), 1e-3);
      vec2 dir = ab / len;
      vec2 q = p - a.xy;
      float t = dot(q, dir);
      float across = dot(q, vec2(-dir.y, dir.x));
      if (b.x < 0.5) {
        // The visitor's rake: deep tine grooves, the sand they move heaped up on both sides.
        float along = smoothstep(-1.0, 0.5, t) * (1.0 - smoothstep(len - 0.5, len + 1.0, t));
        float inside = along * (1.0 - smoothstep(b.y - 1.2, b.y + 0.6, abs(across)));
        float spacing = 2.0 * b.y / ${TUNING.rake.tines.toFixed(1)};
        float g = 0.5 + 0.5 * cos(6.2831853 * across / spacing);
        float groove = b.z * (0.4 - pow(g, 0.55));
        d = mix(d, groove - base, inside);
        float k = (abs(across) - b.y - 2.2) / 2.6;
        d = max(d, b.w * exp(-k * k) * along);
        keep *= 1.0 - inside;
      } else {
        // The invisible rake: fresh lines behind its tines, a little sand pushed ahead of each.
        // Its passes overlap a little, unevenly, and its front isn't quite square, so they blend in.
        float reach = b.y + (noise(vec2(p.x / 90.0, sign(across) * 7.0)) - 0.5) * 1.4 * b.w;
        float band = 1.0 - smoothstep(reach - 0.9 * b.w, reach + 0.9 * b.w, abs(across));
        t += (noise(vec2(p.y / 35.0, 3.0)) - 0.5) * 8.0;
        float along = smoothstep(-1.0, 0.5, t) * (1.0 - smoothstep(len - 0.5, len + 0.5, t));
        float fresh = along * band;
        d = mix(d, 0.0, fresh);
        wear = mix(wear, 0.0, fresh);
        float ahead = exp(-pow((t - len - 2.5) / 2.0, 2.0)) * band;
        d = max(d, b.z * ahead * (0.55 + 0.45 * cos(6.2831853 * across / b.w)));
      }
    } else if (b.x < 1.5) {
      // A crater (or a pebble's dent): a smooth bowl, and a rim of the sand pushed out.
      float r = length(p - a.xy) / a.z;
      float bowl = -b.y * pow(max(1.0 - r * r, 0.0), 2.0);
      float inside = 1.0 - smoothstep(0.55, 1.0, r);
      float rim = b.z * exp(-pow((r - 1.15) / 0.32, 2.0));
      d = mix(d, bowl - base * b.w, inside) + rim;
      keep *= 1.0 - inside * 0.9;
    } else if (b.x < 2.5) {
      // A new message: it fully survives (for now) inside its box.
      vec2 q = p - a.xy;
      if (q.x >= 0.0 && q.y >= 0.0 && q.x <= a.z && q.y <= a.w) keep = 1.0;
    } else {
      // How worn the lines start out: patchy.
      wear = clamp(b.y + b.z * (noise(p / b.w) * 2.0 - 1.0), 0.0, 1.0);
    }
  }
  outColor = vec4(d, keep, wear, 1.0);
}`;

const SETTLE = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uSimSize;
uniform vec2 uCell;
uniform float uDt;
uniform vec4 uSettle;
uniform vec2 uWear;
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
  // The wind erases a pressed message unevenly, gust by gust, and wears the raked lines down.
  keep -= uDt * uErode * (0.3 + 1.4 * g * g);
  float wear = min(here.b + uDt * uWear.x * uWind.z * (0.3 + 1.4 * g), max(here.b, uWear.y));
  outColor = vec4(d, clamp(keep, 0.0, 1.0), wear, 1.0);
}`;

// Smooth-filterable copies of the state: slopes of the disturbances (d/dx, d/dy, y down), height,
// survival; or (uAux) how worn the lines are.
const GRADIENT = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uCell;
uniform float uAux;
out vec4 outColor;
float at(ivec2 c) {
  return texelFetch(uState, clamp(c, ivec2(0), textureSize(uState, 0) - 1), 0).r;
}
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec4 h = texelFetch(uState, c, 0);
  if (uAux > 0.5) {
    outColor = vec4(h.b, 0.0, 0.0, 1.0);
    return;
  }
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
uniform sampler2D uAux;
uniform sampler2D uMessage;
uniform vec4 uMessageRect;
uniform vec3 uMessageShape;
uniform vec2 uSize;
uniform vec2 uRes;
uniform vec2 uSimSize;
uniform vec3 uLight;
uniform vec4 uShade;
uniform vec2 uShadow;
uniform vec3 uGrain;
uniform vec3 uSand;
uniform vec3 uHigh;
uniform vec3 uAccent;
uniform float uVignette;
uniform float uTime;
${GARDEN}
out vec4 outColor;

// Bright highlights roll off softly instead of clipping.
vec3 shoulder(vec3 c) {
  vec3 over = max(c - 0.82, 0.0);
  return min(c, 0.82) + 0.18 * (1.0 - exp(-over / 0.18));
}

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

// Value noise and its slope, from one set of four hashes.
vec3 noiseD(vec2 p) {
  vec2 fl = floor(p);
  ivec2 i = ivec2(fl);
  vec2 f = p - fl;
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  float a = hash(i);
  float b = hash(i + ivec2(1, 0));
  float c = hash(i + ivec2(0, 1));
  float d = hash(i + ivec2(1, 1));
  float k = a - b - c + d;
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * vec2(b - a + k * u.y, c - a + k * u.x));
}

vec2 simUv(vec2 p) {
  return vec2(p.x / uSize.x, 1.0 - p.y / uSize.y);
}

vec4 messageAt(vec2 p) {
  vec2 uv = (p - uMessageRect.xy) / uMessageRect.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture(uMessage, uv);
}

// The garden, the streamers of blown sand, and the pressed message (softer and shallower as the wind erases it).
// (The streamers are added once per pixel, in main: they are soft enough for screen-space slopes.)
float surface(vec2 p, float keep, float wear, vec3 hand, out vec4 w, out float pressed) {
  float h = garden(p, wear, hand, w);
  vec4 m = messageAt(p);
  float press = uMessageShape.z * keep;
  pressed = mix(m.g * 0.85, m.r, keep) * press;
  return mix(h, -uMessageShape.x, pressed) + uMessageShape.y * max(m.g - m.r, 0.0) * press;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * (uSize / uRes);
  float e = uSize.x / uRes.x;

  vec4 dist = smoothSample(uGrad, simUv(p), uSimSize);
  float keep = clamp(dist.a, 0.0, 1.0);
  float wear = texture(uAux, simUv(p)).r;
  vec4 w;
  vec4 wx;
  vec4 wy;
  float pressed;
  float px;
  vec3 hand = handOf(p);
  float h0 = surface(p, keep, wear, hand, w, pressed);
  float hx = surface(p + vec2(e, 0.0), keep, wear, hand, wx, px);
  float hy = surface(p + vec2(0.0, e), keep, wear, hand, wy, px);
  float blown = streamers(p) * (1.0 - w.r) * (1.0 - smoothstep(0.15, 0.3, w.b)) * (1.0 - pressed);
  float bh = blown * ${W.streamerHeight.toFixed(2)};
  vec2 slope = vec2(hx - h0, hy - h0) / e + dist.xy + vec2(dFdx(bh), -dFdy(bh)) / e;

  // Fine grains, smoothed away where the sand is pressed flat.
  float packed = max(w.r, pressed);
  float stone = smoothstep(0.18, 0.3, w.b);
  float grainy = (1.0 - 0.8 * packed) * (1.0 - stone);
  vec2 gp = p / uGrain.x;
  slope += noiseD(gp).yz * (0.7 / uGrain.x) * uGrain.y * grainy;

  vec3 n = normalize(vec3(-slope * uShade.z, 1.0));
  float facing = dot(n, uLight);

  // Cast shadows from the low sun: heaped sand, crater rims, the letters' walls and the stone.
  vec2 sunward = normalize(uLight.xy);
  float rise = uLight.z / length(uLight.xy);
  float here = dist.z + wordHeight(w);
  float block = 0.0;
  for (int i = 0; i < 4; i++) {
    float s = 1.6 * pow(2.0, float(i));
    vec2 q = p + sunward * s;
    float hq = texture(uGrad, simUv(q)).z + wordHeight(wordAt(q));
    block = max(block, hq - here - s * rise);
  }
  float shadow = 1.0 - uShadow.x * smoothstep(0.0, 0.9, block) * (1.0 - stone * 0.6);

  // Pale sand, each grain a little different and the whole faintly mottled; pressed sand is
  // packed a shade darker, blown sand is finer and paler, the stone is the accent.
  ivec2 cell = ivec2(floor(gp));
  float speck = hash(cell);
  float mottle = noise(p / 90.0);
  vec3 sand = uSand * (0.95 + 0.1 * speck) * (0.96 + 0.08 * mottle) * (1.0 - 0.17 * w.r - 0.06 * pressed);
  sand = mix(sand, uHigh * 0.97, 0.18 * min(blown, 1.0));
  vec3 albedo = mix(sand, uAccent * 0.9, stone);

  // Bright daylight, low from the top left, gently falling off across the garden: warm sun,
  // cool sky in the shade, so each ridge has a bright side and a soft shadow.
  vec2 v = p / uSize;
  float sun = uShade.y * (1.08 - 0.16 * dot(v, vec2(0.62, 0.38)));
  vec3 col = albedo * (uShade.x * vec3(0.9, 0.95, 1.06) + sun * max(facing, 0.0) * shadow * vec3(1.06, 1.0, 0.9));

  // Sheen on packed sand and the polished stone; rare glassy grains glint.
  vec3 halfway = normalize(uLight + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, halfway), 0.0), mix(30.0, 70.0, stone)) * mix(0.04 * packed, 0.5, stone);
  float glint = step(1.0 - uGrain.z, hash(cell + ivec2(91, 17))) * smoothstep(0.35, 0.75, facing) * grainy;
  col += uHigh * (spec + glint * 0.12) * shadow;

  // The blown sand catches the light as it travels: a fine, moving shimmer along the streamers.
  vec2 d = uWind.xy;
  float fine = noise((p - d * uWind.w * ${(W.streamerSpeed * 1.4).toFixed(1)}) / 0.9);
  col += uHigh * ${W.streamerGlow.toFixed(3)} * min(blown, 1.2) * (0.4 + fine) * max(facing, 0.2) * shadow;

  v -= 0.5;
  col *= 1.0 - uVignette * dot(v, v) * 1.6;
  col = shoulder(col);
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
uniform vec3 uSand;
uniform vec3 uHigh;
uniform vec2 uShade;
out vec4 outColor;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float ca = cos(vB.z);
  float sa = sin(vB.z);
  vec2 r = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);
  r.y *= vB.w;
  float r2 = dot(r, r);
  if (uShadow > 0.5) {
    float a = (1.0 - smoothstep(0.15, 1.0, r2)) * (vB.x > 0.5 ? 0.4 : 0.26) * vB.y;
    outColor = vec4(0.12, 0.13, 0.17, a);
    return;
  }
  if (r2 > 1.0) discard;
  vec3 n = normalize(vec3(q, sqrt(max(1.0 - r2, 0.0)) * (vB.x > 0.5 ? 0.75 : 1.0)));
  // Grains are the sand itself; pebbles dark grey basalt.
  vec3 albedo = vB.x > 0.5 ? vec3(0.2, 0.2, 0.21) : uSand;
  vec3 col = albedo * (uShade.x + 1.6 * uShade.y * max(dot(n, uLight), 0.0));
  vec3 halfway = normalize(uLight + vec3(0.0, 0.0, 1.0));
  col += uHigh * pow(max(dot(n, halfway), 0.0), vB.x > 0.5 ? 28.0 : 14.0) * (vB.x > 0.5 ? 0.35 : 0.15);
  col = min(col, vec3(1.0));
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
  private aux: Target | null = null;
  private word: Target | null = null;
  private message: Target | null = null;
  private wordRect: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private messageRect: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private black: WebGLTexture;

  private colors: Colors = { sand: TUNING.palette.sand, high: TUNING.palette.high, accent: [0.8, 0.25, 0.12] };
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

  /** True right after the state field was (re)created empty. */
  fresh = false;

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

  /** Sizes the canvas and the state field, keeping what's already there. */
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
      } else this.fresh = true;
      for (const t of old) freeTarget(gl, t);
      freeTarget(gl, this.grad);
      freeTarget(gl, this.aux);
      this.state = next;
      this.grad = makeTarget(gl, simW, simH, "16f");
      this.aux = makeTarget(gl, simW, simH, "16f");
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

  /** The wind's strength (0–1) and the clock, for everything that moves with it. */
  setWind(level: number, time: number) {
    this.wind = { level, time };
  }

  /** Rakes, craters, dents, message stamps, fresh lines. */
  disturb(ops: Op[]) {
    const gl = this.gl;
    for (let start = 0; start < ops.length; start += MAX_OPS) {
      const batch = ops.slice(start, start + MAX_OPS);
      this.opA.fill(0);
      this.opB.fill(0);
      batch.forEach((op, i) => {
        const [a, b] = this.encode(op);
        this.opA.set(a, i * 4);
        this.opB.set(b, i * 4);
      });
      const p = this.simPass(this.disturbP);
      this.gardenUniforms(p, 1);
      gl.uniform4fv(p.u("uOpA"), this.opA);
      gl.uniform4fv(p.u("uOpB"), this.opB);
      gl.uniform1i(p.u("uOpCount"), batch.length);
      gl.uniform1i(p.u("uNeedBase"), batch.some((op) => op.kind === "rake" || op.kind === "crater") ? 1 : 0);
      this.draw();
      this.state.reverse();
    }
  }

  /** Lets the disturbances settle for `dt` seconds; `erode` is how fast the wind erases the message (per second). */
  settle(dt: number, erode: number) {
    const gl = this.gl;
    this.settleDt += dt;
    this.settleFrames++;
    // Half floats can't hold the tiny per-frame changes: settle in bigger, rarer steps there.
    if (this.format === "16f" && this.settleFrames % 4 !== 0) return;
    const s = TUNING.settle;
    const p = this.simPass(this.settleP);
    this.gardenUniforms(p, 1);
    gl.uniform1f(p.u("uDt"), this.settleDt);
    gl.uniform4f(p.u("uSettle"), s.calm, s.windy, s.blurCalm, s.blurWindy);
    gl.uniform2f(p.u("uWear"), s.wear, s.maxWear);
    gl.uniform1f(p.u("uErode"), erode);
    this.draw();
    this.state.reverse();
    this.settleDt = 0;
  }

  /** Draws the garden, then the sprites (`count` of them in `sprites`). */
  render(time: number, press: number, sprites: Float32Array, count: number) {
    const gl = this.gl;
    // Filterable copies of the state first.
    const gp = this.gradientP.use();
    this.bind(0, this.state[0].tex);
    gl.uniform1i(gp.u("uState"), 0);
    gl.uniform2f(gp.u("uCell"), this.cell[0], this.cell[1]);
    for (const [target, aux] of [
      [this.grad!, 0],
      [this.aux!, 1],
    ] as const) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.w, target.h);
      gl.uniform1f(gp.u("uAux"), aux);
      this.draw();
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.res[0], this.res[1]);
    const p = this.sandP.use();
    this.bind(0, this.grad!.tex);
    gl.uniform1i(p.u("uGrad"), 0);
    this.gardenUniforms(p, 1);
    this.bind(2, this.message?.tex ?? this.black);
    gl.uniform1i(p.u("uMessage"), 2);
    this.bind(3, this.aux!.tex);
    gl.uniform1i(p.u("uAux"), 3);
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
    gl.uniform2f(p.u("uShadow"), l.shadow, 0);
    const gr = TUNING.grain;
    gl.uniform3f(p.u("uGrain"), gr.size, gr.relief, gr.glint);
    gl.uniform3fv(p.u("uSand"), this.colors.sand as number[]);
    gl.uniform3fv(p.u("uHigh"), this.colors.high as number[]);
    gl.uniform3fv(p.u("uAccent"), this.colors.accent as number[]);
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
      gl.uniform3fv(sp.u("uSand"), this.colors.sand as number[]);
      gl.uniform3fv(sp.u("uHigh"), this.colors.high as number[]);
      gl.uniform2f(sp.u("uShade"), l.ambient, l.sun);
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
    for (const t of [this.grad, this.aux, this.word, this.message]) freeTarget(gl, t);
    this.grad = this.aux = this.word = this.message = null;
    gl.deleteTexture(this.black);
    for (const p of [this.disturbP, this.settleP, this.gradientP, this.copyP, this.blurP, this.sandP, this.spriteP]) p.dispose();
    gl.deleteBuffer(this.spriteBuffer);
    gl.deleteVertexArray(this.spriteVao);
    gl.deleteVertexArray(this.vao);
  }

  // ---------------------------------------------------------------------------

  private encode(op: Op): [number[], number[]] {
    switch (op.kind) {
      case "rake":
        return [
          [op.x0, op.y0, op.x1, op.y1],
          [0, op.half, op.depth, op.berm],
        ];
      case "crater":
        return [
          [op.x, op.y, op.radius, 0],
          [1, op.depth, op.rim, op.flatten],
        ];
      case "stamp":
        return [
          [op.rect.x, op.rect.y, op.rect.w, op.rect.h],
          [2, 0, 0, 0],
        ];
      case "refresh":
        return [
          [op.x0, op.y0, op.x1, op.y1],
          [3, op.half, op.heap, op.period],
        ];
      case "wear":
        return [
          [0, 0, 0, 0],
          [4, op.level, op.spread, op.scale],
        ];
    }
  }

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
    gl.uniform4f(p.u("uStone"), g.stone[0], g.stone[1], g.stone[2], 0);
    gl.uniform4f(p.u("uRake"), g.period, g.amp, TUNING.garden.wornLoss, 0);
    gl.uniform4f(p.u("uRing"), 0, g.margin, g.rings, 0);
    gl.uniform4f(p.u("uWordShape"), g.depth, g.rim, g.stoneHeight, 0);
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
