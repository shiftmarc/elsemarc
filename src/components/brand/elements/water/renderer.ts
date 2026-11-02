import { TUNING } from "./tuning";

/**
 * The pool on the GPU (WebGL2), in three kinds of pass:
 *
 * - Ripples: a height-field in a pair of half-float textures (R = height
 *   now, G = height one step ago), stepped with the discrete wave equation.
 *   Drops and tilt waves are added to it in their own pass.
 * - Surface: looks down through that field (plus analytic swells) at the
 *   pool floor: the words lie there, shifted by the water's slope, lit by
 *   drifting caustics and glints off the surface.
 *
 * Coordinates are CSS px from the canvas's top-left, y down, throughout.
 */

export type Colors = { base: number[]; color: number[]; accent: number[] };

export type Drop = { x: number; y: number; radius: number; amp: number };

/** A plane wave rising along the edge opposite `dir` (unit vector it rolls towards). */
export type EdgeWave = { dx: number; dy: number; amp: number; width: number };

/** Where the sinking message is drawn and how far along it is. */
export type MessageState = {
  alpha: number;
  /** Mip bias: how blurred (deep) it looks. */
  blur: number;
  scale: number;
  driftY: number;
  waver: number;
  cx: number;
  cy: number;
};

const MAX_DROPS = 16;

const VERT = `#version 300 es
void main() {
  // One triangle that covers the screen.
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const STEP = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform float uDamping;
uniform float uViscosity;
uniform float uSpeed;
out vec4 outColor;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 m = textureSize(uState, 0) - 1;
  vec4 here = texelFetch(uState, c, 0);
  // Edges reflect: a missing neighbour reads as this cell.
  vec2 l = texelFetch(uState, clamp(c + ivec2(-1, 0), ivec2(0), m), 0).rg;
  vec2 r = texelFetch(uState, clamp(c + ivec2(1, 0), ivec2(0), m), 0).rg;
  vec2 d = texelFetch(uState, clamp(c + ivec2(0, -1), ivec2(0), m), 0).rg;
  vec2 u = texelFetch(uState, clamp(c + ivec2(0, 1), ivec2(0), m), 0).rg;
  vec2 lap = l + r + u + d - 4.0 * here.rg;
  // Wave equation, plus a viscous term that calms the finest (grid-sized)
  // wiggles much more than real ripples. Stable while speed <= 0.5 - 2 * viscosity.
  float next = 2.0 * here.r - here.g + uSpeed * lap.x + uViscosity * (lap.x - lap.y);
  outColor = vec4(next * uDamping, here.r, 0.0, 1.0);
}`;

const DROP = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uCell;
uniform vec2 uSimSize;
uniform vec4 uDrops[${MAX_DROPS}];
uniform int uDropCount;
uniform vec4 uWave;
uniform float uWaveEdge;
out vec4 outColor;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec4 s = texelFetch(uState, c, 0);
  vec2 p = vec2(gl_FragCoord.x, uSimSize.y - gl_FragCoord.y) * uCell;
  float add = 0.0;
  for (int i = 0; i < ${MAX_DROPS}; i++) {
    if (i >= uDropCount) break;
    vec4 d = uDrops[i];
    float q = clamp(1.0 - dot(p - d.xy, p - d.xy) / (d.z * d.z), 0.0, 1.0);
    add += d.w * q * q;
  }
  if (uWave.z != 0.0) {
    float k = (dot(p, uWave.xy) - uWaveEdge) / uWave.w;
    add += uWave.z * exp(-k * k);
  }
  outColor = vec4(s.r + add, s.g + add * 0.6, 0.0, 1.0);
}`;

const COPY = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uSimSize;
out vec4 outColor;
void main() {
  outColor = texture(uState, gl_FragCoord.xy / uSimSize);
}`;

const swells = TUNING.swell.waves.length;

const SURFACE = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform sampler2D uFloor;
uniform sampler2D uMessage;
uniform vec2 uSize;
uniform vec2 uRes;
uniform vec2 uSimSize;
uniform vec2 uCell;
uniform float uTime;
uniform vec2 uFloorShift;
uniform vec3 uBase;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform vec4 uSwell[${swells}];
uniform vec4 uMessageA;
uniform float uMessageBlur;
uniform float uShade;
uniform float uFocus;
uniform vec2 uMessageCenter;
uniform float uDepth;
uniform float uInkMix;
uniform vec4 uCaustic;
uniform vec4 uLight;
uniform float uVignette;
out vec4 outColor;

// Integer hash: exact, so neighbouring noise cells always agree (float hashes can seam).
float hash(ivec2 c) {
  uvec2 q = uvec2(c) * uvec2(1597334673u, 3812015801u);
  uint n = (q.x ^ q.y) * 1597334673u;
  n ^= n >> 16;
  n *= 2246822519u;
  n ^= n >> 13;
  return float(n) * (1.0 / 4294967295.0);
}

float noise(vec2 p) {
  vec2 fl = floor(p);
  ivec2 i = ivec2(fl);
  vec2 f = p - fl;
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + ivec2(1, 0)), u.x), mix(hash(i + ivec2(0, 1)), hash(i + ivec2(1, 1)), u.x), u.y);
}

// Bright, thin, wandering lines: ridges of domain-warped noise.
float causticLayer(vec2 p, float t) {
  vec2 w = vec2(noise(p * 0.55 + vec2(t * 0.6, -t * 0.4)), noise(p * 0.55 + vec2(5.2 - t * 0.5, 1.3 + t * 0.3)));
  float n = noise(p + w * 1.7 + vec2(t * 0.25, t * 0.15));
  float ridge = 1.0 - abs(n * 2.0 - 1.0);
  return pow(ridge, 7.0);
}

float caustics(vec2 p, float t) {
  vec2 q = p / uCaustic.x;
  float a = causticLayer(q, t);
  float b = causticLayer(q * 1.41 + vec2(3.7, 8.1), -t * 0.83);
  return a * 0.65 + b * 0.55 + a * b * 1.4;
}

float height(vec2 uv) { return texture(uState, uv).r; }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * (uSize / uRes);

  // The surface's slope: ripples from the field, plus slow swells.
  vec2 suv = vec2(p.x / uSize.x, 1.0 - p.y / uSize.y);
  vec2 e = 1.0 / uSimSize;
  float hc = height(suv);
  float hl = height(suv - vec2(e.x, 0.0));
  float hr = height(suv + vec2(e.x, 0.0));
  float hu = height(suv + vec2(0.0, e.y)); // up the screen
  float hd = height(suv - vec2(0.0, e.y));
  vec2 slope = vec2(hr - hl, hd - hu) / (2.0 * uCell);
  float bend = (hl + hr + hu + hd - 4.0 * hc) / (uCell.x * uCell.y);
  for (int i = 0; i < ${swells}; i++) {
    vec4 s = uSwell[i]; // direction xy (scaled by wavenumber), slope, angular speed
    slope += normalize(s.xy) * s.z * cos(dot(p, s.xy) - s.w * uTime);
  }

  // What's on the floor, seen through it.
  vec2 seen = p - slope * uDepth;
  vec2 fuv = (seen - uFloorShift) / uSize;
  vec4 floorInk = texture(uFloor, fuv);
  // The message lies a little deeper: smaller, drifted down, and bent more by the water.
  vec2 mq = seen - slope * uDepth * uMessageA.w - vec2(0.0, uMessageA.z);
  vec2 mp = (mq - uMessageCenter) / uMessageA.y + uMessageCenter;
  float message = texture(uMessage, mp / uSize, uMessageBlur).r * uMessageA.x;

  float ink = clamp(floorInk.r + message, 0.0, 1.0);
  float accent = floorInk.g;
  vec3 col = uBase;
  col = mix(col, uInk, ink * uInkMix);
  col = mix(col, uAccent, accent * 0.95);

  // Light on the floor: drifting caustics, focused further where ripples bend it.
  float c = caustics(seen, uTime * uCaustic.y);
  float light = c * mix(uCaustic.z, uCaustic.w, max(ink, accent)) + max(0.0, -bend) * uFocus;
  col += uInk * light;
  col *= 1.0 + clamp(-bend * 6.0, -0.25, 0.4) * 0.5;

  // Slopes facing the light are brighter, facing away darker: ripples read as rings.
  float facing = dot(slope, normalize(vec2(-0.55, -0.83)));
  col += uInk * clamp(facing * uShade, -0.05, 0.12);

  // The surface itself: glints on ripples, a sheen on slopes.
  vec3 n = normalize(vec3(-slope * 2.2, 1.0));
  vec3 l = normalize(vec3(-0.45, 0.62, 0.64));
  float spec = pow(max(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0), uLight.y);
  col += uInk * (spec * uLight.x + clamp(length(slope) * uLight.z, 0.0, 0.08));

  vec2 v = p / uSize - 0.5;
  col *= 1.0 - uVignette * dot(v, v) * 1.6;
  col += (hash(ivec2(gl_FragCoord.xy) + ivec2(int(uTime * 60.0) * 7919, 0)) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}`;

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader: ${log}`);
  }
  return shader;
}

class Program {
  program: WebGLProgram;
  private locations = new Map<string, WebGLUniformLocation | null>();
  constructor(
    private gl: WebGL2RenderingContext,
    fragment: string,
  ) {
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(`Link: ${gl.getProgramInfoLog(this.program)}`);
  }
  use() {
    this.gl.useProgram(this.program);
    return this;
  }
  u(name: string) {
    if (!this.locations.has(name)) this.locations.set(name, this.gl.getUniformLocation(this.program, name));
    return this.locations.get(name)!;
  }
}

export class PoolRenderer {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private step: Program;
  private drop: Program;
  private copy: Program;
  private surface: Program;
  private state: Target[] = [];
  private floor: WebGLTexture;
  private message: WebGLTexture;
  private colors: Colors = { base: [0.09, 0.09, 0.09], color: [1, 1, 1], accent: [1, 0.3, 0.2] };
  private dropData = new Float32Array(MAX_DROPS * 4);

  private size = [1, 1];
  private res = [1, 1];
  private simSize = [1, 1];
  private cell = [1, 1];

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    // Ripples need a float colour target; without one the still version shows.
    if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) {
      throw new Error("No float render targets");
    }
    this.vao = gl.createVertexArray()!;
    this.step = new Program(gl, STEP);
    this.drop = new Program(gl, DROP);
    this.copy = new Program(gl, COPY);
    this.surface = new Program(gl, SURFACE);
    this.floor = this.texture();
    this.message = this.texture();
    this.upload(this.floor, null);
    this.upload(this.message, null);
  }

  setColors(colors: Colors) {
    this.colors = colors;
  }

  /** Sizes the canvas and the ripple field, keeping the ripples already there. */
  resize(cssW: number, cssH: number, pixelRatio: number) {
    const gl = this.gl;
    this.size = [cssW, cssH];
    this.res = [Math.max(1, Math.round(cssW * pixelRatio)), Math.max(1, Math.round(cssH * pixelRatio))];
    const cell = TUNING.sim.cell;
    const simW = Math.max(8, Math.ceil(cssW / cell));
    const simH = Math.max(8, Math.ceil(cssH / cell));
    this.cell = [cssW / simW, cssH / simH];
    const old = this.state;
    if (simW !== this.simSize[0] || simH !== this.simSize[1] || old.length === 0) {
      const next = [this.target(simW, simH), this.target(simW, simH)];
      for (const t of next) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Ripple target incomplete");
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (old.length) {
          gl.viewport(0, 0, simW, simH);
          this.copy.use();
          this.bind(0, old[0].tex);
          gl.uniform1i(this.copy.u("uState"), 0);
          gl.uniform2f(this.copy.u("uSimSize"), simW, simH);
          this.draw();
        }
      }
      for (const t of old) this.free(t);
      this.state = next;
      this.simSize = [simW, simH];
    }
    gl.canvas.width = this.res[0];
    gl.canvas.height = this.res[1];
  }

  /** The pool floor: R = logo letters, G = the accent. Drawn at the canvas's pixel size. */
  setFloor(source: TexImageSource) {
    this.upload(this.floor, source);
  }

  /** The sinking message's letters, in R. */
  setMessage(source: TexImageSource | null) {
    const gl = this.gl;
    this.upload(this.message, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  /** Adds drops and (optionally) one tilt wave to the ripple field. */
  disturb(drops: Drop[], wave: EdgeWave | null) {
    const gl = this.gl;
    let start = 0;
    while (start < drops.length || wave) {
      const batch = drops.slice(start, start + MAX_DROPS);
      start += MAX_DROPS;
      this.dropData.fill(0);
      batch.forEach((d, i) => this.dropData.set([d.x, d.y, d.radius, d.amp], i * 4));
      const p = this.drop.use();
      this.bind(0, this.state[0].tex);
      gl.uniform1i(p.u("uState"), 0);
      gl.uniform2f(p.u("uCell"), this.cell[0], this.cell[1]);
      gl.uniform2f(p.u("uSimSize"), this.simSize[0], this.simSize[1]);
      gl.uniform4fv(p.u("uDrops"), this.dropData);
      gl.uniform1i(p.u("uDropCount"), batch.length);
      if (wave) {
        const [w, h] = this.size;
        // The raised edge: the corner furthest "uphill" along the wave's direction.
        const edge = Math.min(0, wave.dx * w, wave.dy * h, wave.dx * w + wave.dy * h);
        gl.uniform4f(p.u("uWave"), wave.dx, wave.dy, wave.amp, wave.width);
        gl.uniform1f(p.u("uWaveEdge"), edge);
        wave = null;
      } else gl.uniform4f(p.u("uWave"), 0, 0, 0, 1);
      this.into(this.state[1]);
      this.draw();
      this.swap();
    }
  }

  /** Advances the ripples `n` steps. */
  advance(n: number) {
    const gl = this.gl;
    const p = this.step.use();
    gl.uniform1f(p.u("uDamping"), TUNING.sim.damping);
    gl.uniform1f(p.u("uViscosity"), TUNING.sim.viscosity);
    gl.uniform1f(p.u("uSpeed"), TUNING.sim.speed);
    gl.uniform1i(p.u("uState"), 0);
    for (let i = 0; i < n; i++) {
      this.bind(0, this.state[0].tex);
      this.into(this.state[1]);
      this.draw();
      this.swap();
    }
  }

  /** Draws the pool to the canvas. */
  render(time: number, floorShift: [number, number], msg: MessageState) {
    const gl = this.gl;
    const r = TUNING.render;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.res[0], this.res[1]);
    const p = this.surface.use();
    this.bind(0, this.state[0].tex);
    this.bind(1, this.floor);
    this.bind(2, this.message);
    gl.uniform1i(p.u("uState"), 0);
    gl.uniform1i(p.u("uFloor"), 1);
    gl.uniform1i(p.u("uMessage"), 2);
    gl.uniform2f(p.u("uSize"), this.size[0], this.size[1]);
    gl.uniform2f(p.u("uRes"), this.res[0], this.res[1]);
    gl.uniform2f(p.u("uSimSize"), this.simSize[0], this.simSize[1]);
    gl.uniform2f(p.u("uCell"), this.cell[0], this.cell[1]);
    gl.uniform1f(p.u("uTime"), time);
    gl.uniform2f(p.u("uFloorShift"), floorShift[0], floorShift[1]);
    gl.uniform3fv(p.u("uBase"), this.colors.base);
    gl.uniform3fv(p.u("uInk"), this.colors.color);
    gl.uniform3fv(p.u("uAccent"), this.colors.accent);
    const swell = new Float32Array(swells * 4);
    TUNING.swell.waves.forEach((w, i) => {
      const k = (2 * Math.PI) / w.length;
      const a = (w.angle * Math.PI) / 180;
      swell.set([Math.cos(a) * k, Math.sin(a) * k, w.slope, k * w.speed], i * 4);
    });
    gl.uniform4fv(p.u("uSwell"), swell);
    gl.uniform4f(p.u("uMessageA"), msg.alpha, msg.scale, msg.driftY, msg.waver);
    gl.uniform2f(p.u("uMessageCenter"), msg.cx, msg.cy);
    gl.uniform1f(p.u("uMessageBlur"), msg.blur);
    gl.uniform1f(p.u("uShade"), r.shade);
    gl.uniform1f(p.u("uFocus"), r.focus);
    gl.uniform1f(p.u("uDepth"), r.depth);
    gl.uniform1f(p.u("uInkMix"), r.ink);
    gl.uniform4f(p.u("uCaustic"), r.causticSize, r.causticSpeed, r.caustic, r.causticInk);
    gl.uniform4f(p.u("uLight"), r.specular, r.shininess, r.sheen, 0);
    gl.uniform1f(p.u("uVignette"), r.vignette);
    this.draw();
  }

  dispose() {
    const gl = this.gl;
    for (const t of this.state) this.free(t);
    this.state = [];
    gl.deleteTexture(this.floor);
    gl.deleteTexture(this.message);
    gl.deleteProgram(this.step.program);
    gl.deleteProgram(this.drop.program);
    gl.deleteProgram(this.copy.program);
    gl.deleteProgram(this.surface.program);
    gl.deleteVertexArray(this.vao);
  }

  // ---------------------------------------------------------------------------

  private draw() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private into(t: Target) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.viewport(0, 0, this.simSize[0], this.simSize[1]);
  }

  private swap() {
    this.state.reverse();
  }

  private bind(unit: number, tex: WebGLTexture) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  }

  private texture() {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  private upload(tex: WebGLTexture, source: TexImageSource | null) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    if (source) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  }

  private target(w: number, h: number): Target {
    const gl = this.gl;
    const tex = this.texture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  }

  private free(t: Target) {
    this.gl.deleteFramebuffer(t.fbo);
    this.gl.deleteTexture(t.tex);
  }
}
