import { TUNING } from "./tuning";

/**
 * Two passes, no libraries:
 *
 * 1. Splat: every particle adds a soft kernel into a "field" texture.
 *    R = depth, G = depth that is accent-coloured, B = depth that is
 *    settled in its letter.
 * 2. Glass: a full-screen pass draws the tank's faint back wall, then cuts
 *    the field at a threshold into a liquid outline. Inside it, the wall is
 *    seen through curved clear water: bent by the surface, with bright
 *    edges and a highlight, and no opaque fill. Where the water rests in
 *    its letter, the outline tightens onto the crisp letter mask.
 */

const SPLAT_VS = `#version 300 es
layout(location = 0) in vec4 aParticle;
layout(location = 1) in float aWeight;
uniform vec2 uView;
uniform float uSize;
out vec3 vData;
void main() {
  vec2 clip = aParticle.xy / uView * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = uSize;
  vData = vec3(aParticle.zw, aWeight);
}`;

const SPLAT_FS = `#version 300 es
precision highp float;
in vec3 vData;
uniform float uGain;
out vec4 outColor;
void main() {
  vec2 d = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(d, d);
  if (r2 >= 1.0) discard;
  float w = 1.0 - r2;
  w = w * w * w * uGain * vData.z;
  outColor = vec4(w, w * vData.x, w * vData.y, 0.0);
}`;

const SURFACE_VS = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const SURFACE_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
uniform sampler2D uMask;
uniform vec2 uCss;
uniform float uNorm;
uniform float uThreshold;
uniform float uMaskLod;
uniform float uNormalPx;
uniform float uBump;
uniform float uRefract;
uniform float uRim;
uniform float uEdge;
uniform float uSpecular;
uniform float uLift;
uniform float uBody;
uniform float uAccentBody;
uniform float uTile;
uniform float uWallLine;
uniform float uWallGrain;
uniform float uShimmer;
uniform float uShimmerScale;
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uColor;
uniform vec3 uAccent;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

// The tank's back wall at CSS position p (y down): a faint grid over soft grain.
vec3 wall(vec2 p) {
  vec2 f = fract(p / uTile);
  vec2 d = min(f, 1.0 - f) * uTile;
  float line = 1.0 - smoothstep(0.0, 1.0, min(d.x, d.y));
  float grain = noise(p * 0.35) - 0.5;
  float cloud = noise(p / (uTile * 3.0)) - 0.5;
  return uBase * (1.0 + uWallGrain * (grain * 2.0 + cloud * 1.5)) + vec3(uWallLine * line);
}

float heightAt(vec2 uv, float s) {
  float r = smoothstep(0.15, 1.2, texture(uField, uv).r * uNorm);
  return mix(r, textureLod(uMask, uv, uMaskLod).a, s);
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uCss;
  vec3 back = wall(p);

  vec4 f = texture(uField, vUv);
  float depth = f.r * uNorm;
  float accent = f.r > 1e-5 ? f.g / f.r : 0.0;
  float settled = f.r > 1e-5 ? f.b / f.r : 0.0;
  vec4 m = texture(uMask, vUv);
  float maskAccent = m.a > 0.01 ? 1.0 - m.g : 0.0; // uploads unpremultiplied

  // Where the water rests in its letter, use the letter's exact outline.
  float s = smoothstep(0.3, 0.7, settled) * smoothstep(0.08, 0.45, depth);
  float aa = fwidth(depth) + 0.015;
  float liquid = smoothstep(uThreshold - aa, uThreshold + aa, depth);
  float cover = mix(liquid, m.a, s);
  if (cover < 0.002) { outColor = vec4(back, 1.0); return; }

  // Surface normal from the smoothed depth (uv space, y up).
  vec2 o = uNormalPx / uCss;
  float hl = heightAt(vUv - vec2(o.x, 0.0), s);
  float hr = heightAt(vUv + vec2(o.x, 0.0), s);
  float hd = heightAt(vUv - vec2(0.0, o.y), s);
  float hu = heightAt(vUv + vec2(0.0, o.y), s);
  vec3 n = vec3((hl - hr) * uBump, (hd - hu) * uBump, 1.0);
  vec2 q = p / uShimmerScale;
  vec2 t = vec2(uTime, uTime * 0.63);
  n.xy += (vec2(noise(q + t), noise(q * 1.3 - t + 17.3)) - 0.5) * uShimmer * 2.0;
  n = normalize(n);

  float acc = mix(accent, maskAccent, s);
  vec3 tint = mix(uColor, uAccent, acc);

  // Look through the water: the wall, bent by the curved surface.
  vec3 seen = wall(p - vec2(n.x, -n.y) * uRefract);
  vec3 glass = seen * (1.0 + uLift) + tint * uBody;
  glass = mix(glass, tint * 0.75 + seen * 0.25, acc * uAccentBody);

  // Highlights: a rim where the surface curves (brighter facing the light),
  // a sharp glint, and a fine line where water meets air.
  vec2 lightDir = normalize(vec2(-0.45, 0.6));
  float slope = length(n.xy);
  float facing = slope > 1e-4 ? dot(n.xy / slope, lightDir) : 0.0;
  float rim = smoothstep(0.06, 0.7, slope) * (0.55 + 0.45 * facing);
  vec3 L = normalize(vec3(lightDir, 1.0));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 60.0);
  float edgeLine = cover * (1.0 - cover) * 4.0;
  glass += tint * (max(rim, 0.0) * uRim + edgeLine * uEdge) + spec * uSpecular;

  outColor = vec4(clamp(mix(back, glass, cover), 0.0, 1.0), 1.0);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const program = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader");
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link");
  return program;
}

function uniforms(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const map: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const name = gl.getActiveUniform(program, i)!.name;
    map[name] = gl.getUniformLocation(program, name);
  }
  return map;
}

type RGB = [number, number, number];
export type Colors = { base: RGB; color: RGB; accent: RGB };

/** Floats per particle in the instance buffer: x, y, accent, settled, weight. */
export const STRIDE = 5;

export class WaterRenderer {
  private gl: WebGL2RenderingContext;
  private splat: WebGLProgram;
  private surface: WebGLProgram;
  private su: Record<string, WebGLUniformLocation | null>;
  private fu: Record<string, WebGLUniformLocation | null>;
  private vao: WebGLVertexArrayObject;
  private emptyVao: WebGLVertexArrayObject;
  private buffer: WebGLBuffer;
  private capacity = 0;
  private fieldTex: WebGLTexture;
  private fbo: WebGLFramebuffer;
  private maskTex: WebGLTexture;
  private halfFloat: boolean;
  private maxPoint: number;

  private css = [1, 1];
  private fieldSize = [1, 1];
  private fieldScale = 1;
  private fontSize = 100;
  private maskLod = 0;
  private pointSize = 1;
  private gain = 1;
  private norm = 1;
  private colors: Colors = { base: [0.094, 0.094, 0.086], color: [0.96, 0.95, 0.92], accent: [0.89, 0.31, 0.17] };

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.splat = compile(gl, SPLAT_VS, SPLAT_FS);
    this.surface = compile(gl, SURFACE_VS, SURFACE_FS);
    this.su = uniforms(gl, this.splat);
    this.fu = uniforms(gl, this.surface);

    this.buffer = gl.createBuffer()!;
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, STRIDE * 4, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, STRIDE * 4, 16);
    this.emptyVao = gl.createVertexArray()!;
    gl.bindVertexArray(null);

    this.halfFloat = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    this.maxPoint = (gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array)[1] || 64;

    this.fieldTex = gl.createTexture()!;
    this.fbo = gl.createFramebuffer()!;
    this.maskTex = gl.createTexture()!;
  }

  setColors(colors: Colors) {
    this.colors = colors;
  }

  /**
   * Sizes the drawing buffer and the field for a canvas of `cssW`×`cssH`,
   * with particles `spacing` apart and `density` per px², for a word of `fontSize`.
   */
  configure(cssW: number, cssH: number, pixelRatio: number, spacing: number, density: number, fontSize: number) {
    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.width = Math.max(1, Math.round(cssW * pixelRatio));
    canvas.height = Math.max(1, Math.round(cssH * pixelRatio));
    this.css = [cssW, cssH];
    this.fontSize = fontSize;

    // A few field texels per particle is enough; the glass pass smooths the rest.
    this.fieldScale = Math.min(1, Math.max(0.35, 2.5 / spacing));
    const fw = Math.max(1, Math.round(cssW * this.fieldScale));
    const fh = Math.max(1, Math.round(cssH * this.fieldScale));
    this.fieldSize = [fw, fh];

    const radius = spacing * TUNING.render.splatRadius;
    this.pointSize = Math.min(this.maxPoint, Math.max(2, radius * 2 * this.fieldScale));
    const effective = this.pointSize / (2 * this.fieldScale);
    // Resting depth inside a letter: density × ∫(1−r²)³ over the disc = density·πR²/4.
    const rest = (density * Math.PI * effective * effective) / 4;
    const store = this.halfFloat ? 1 : 1 / 3; // 8-bit fields saturate at 1: store a third
    this.gain = store / rest;
    this.norm = 1 / store;
    // The resting letters curve over `roundness` of the font size.
    this.maskLod = Math.max(0, Math.log2(Math.max(1, TUNING.render.roundness * fontSize * pixelRatio)));

    this.allocateField(fw, fh);
  }

  private allocateField(fw: number, fh: number) {
    const gl = this.gl;
    const tryFormat = (half: boolean) => {
      gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
      if (half) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, fw, fh, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, fw, fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fieldTex, 0);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return ok;
    };
    if (this.halfFloat && !tryFormat(true)) {
      this.halfFloat = false;
      this.gain /= 3;
      this.norm *= 3;
    }
    if (!this.halfFloat && !tryFormat(false)) throw new Error("No renderable field format");
  }

  /** Uploads the crisp letter mask (white letters, red accent, transparent elsewhere). */
  setMask(mask: HTMLCanvasElement) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /** Redraws the field from `count` particles in `data` (STRIDE floats each). */
  splatField(data: Float32Array, count: number) {
    const gl = this.gl;
    if (count > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      if (count * STRIDE > this.capacity) {
        this.capacity = data.length;
        gl.bufferData(gl.ARRAY_BUFFER, this.capacity * 4, gl.DYNAMIC_DRAW);
      }
      // Length must be non-zero: WebGL2 reads 0 as "to the end of data".
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, count * STRIDE);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.fieldSize[0], this.fieldSize[1]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (count > 0) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(this.splat);
      gl.uniform2f(this.su.uView, this.css[0], this.css[1]);
      gl.uniform1f(this.su.uSize, this.pointSize);
      gl.uniform1f(this.su.uGain, this.gain);
      gl.bindVertexArray(this.vao);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.bindVertexArray(null);
      gl.disable(gl.BLEND);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Draws the tank: back wall and glass water, from the current field. */
  drawSurface(time: number) {
    const gl = this.gl;
    const r = TUNING.render;
    const font = this.fontSize;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.useProgram(this.surface);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    const u = this.fu;
    gl.uniform1i(u.uField, 0);
    gl.uniform1i(u.uMask, 1);
    gl.uniform2f(u.uCss, this.css[0], this.css[1]);
    gl.uniform1f(u.uNorm, this.norm);
    gl.uniform1f(u.uThreshold, r.threshold);
    gl.uniform1f(u.uMaskLod, this.maskLod);
    gl.uniform1f(u.uNormalPx, Math.max(1.5, r.roundness * font));
    gl.uniform1f(u.uBump, r.bump);
    gl.uniform1f(u.uRefract, r.refraction * font);
    gl.uniform1f(u.uRim, r.rim);
    gl.uniform1f(u.uEdge, r.edge);
    gl.uniform1f(u.uSpecular, r.specular);
    gl.uniform1f(u.uLift, r.lift);
    gl.uniform1f(u.uBody, r.body);
    gl.uniform1f(u.uAccentBody, r.accentBody);
    gl.uniform1f(u.uTile, Math.max(12, r.wallTile * font));
    gl.uniform1f(u.uWallLine, r.wallLine);
    gl.uniform1f(u.uWallGrain, r.wallGrain);
    gl.uniform1f(u.uShimmer, r.shimmer);
    gl.uniform1f(u.uShimmerScale, Math.max(8, font * r.shimmerScale));
    gl.uniform1f(u.uTime, time * r.shimmerSpeed);
    gl.uniform3fv(u.uBase, this.colors.base);
    gl.uniform3fv(u.uColor, this.colors.color);
    gl.uniform3fv(u.uAccent, this.colors.accent);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.splat);
    gl.deleteProgram(this.surface);
    gl.deleteBuffer(this.buffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteVertexArray(this.emptyVao);
    gl.deleteTexture(this.fieldTex);
    gl.deleteTexture(this.maskTex);
    gl.deleteFramebuffer(this.fbo);
  }
}
