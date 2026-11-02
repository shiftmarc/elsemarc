/**
 * Small WebGL2 helpers for elements: programs with cached uniform
 * locations, float render targets, and textures.
 */

/** One triangle that covers the screen (no vertex buffers needed). */
export const FULLSCREEN_VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/** Exact integer hash and smooth value noise (float hashes can seam on some GPUs). */
export const NOISE_GLSL = `
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
}`;

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

export class Program {
  program: WebGLProgram;
  private locations = new Map<string, WebGLUniformLocation | null>();
  constructor(
    private gl: WebGL2RenderingContext,
    fragment: string,
    vertex = FULLSCREEN_VERT,
  ) {
    const vs = compile(gl, gl.VERTEX_SHADER, vertex);
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
  dispose() {
    this.gl.deleteProgram(this.program);
  }
}

export type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };

export function makeTexture(gl: WebGL2RenderingContext, filter: number = gl.LINEAR) {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

/** A float render target: RGBA32F (sampled with texelFetch only) or RGBA16F (filterable). */
export function makeTarget(gl: WebGL2RenderingContext, w: number, h: number, format: "32f" | "16f"): Target {
  const tex = makeTexture(gl, format === "32f" ? gl.NEAREST : gl.LINEAR);
  if (format === "32f") gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Render target incomplete");
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return { tex, fbo, w, h };
}

export function freeTarget(gl: WebGL2RenderingContext, t: Target | null) {
  if (!t) return;
  gl.deleteFramebuffer(t.fbo);
  gl.deleteTexture(t.tex);
}

/** Uploads a canvas (or a 1×1 black pixel for null) as plain RGBA8. */
export function upload(gl: WebGL2RenderingContext, tex: WebGLTexture, source: TexImageSource | null) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  if (source) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
}
