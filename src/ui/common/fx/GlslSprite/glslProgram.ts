import type { GlslProgramDef, GlslUniforms } from "./types";

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/** 每个程序都会拿到的公共 uniform；坐标系为设计 px，原点在画布左下角。 */
const FRAGMENT_HEADER = `
precision highp float;
varying vec2 vUv;
uniform vec2 uSize;
uniform float uTime;
uniform float uPhase;
uniform float uActive;
uniform float uSeed;
uniform float uAA;
`;

export interface CompiledProgram {
  program: WebGLProgram;
  aPos: number;
  locations: Map<string, WebGLUniformLocation | null>;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string, key: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    console.error(`[着色器] ${key} 编译失败\n${gl.getShaderInfoLog(shader) ?? ""}`);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function compileProgram(gl: WebGLRenderingContext, def: GlslProgramDef): CompiledProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX, def.key);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_HEADER + def.fragment, def.key);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    console.error(`[着色器] ${def.key} 链接失败\n${gl.getProgramInfoLog(program) ?? ""}`);
    gl.deleteProgram(program);
    return null;
  }
  return { program, aPos: gl.getAttribLocation(program, "aPos"), locations: new Map() };
}

/** 覆盖整个视口的单个三角形。 */
export function createFullscreenTriangle(gl: WebGLRenderingContext): WebGLBuffer | null {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  return buffer;
}

function location(gl: WebGLRenderingContext, compiled: CompiledProgram, name: string): WebGLUniformLocation | null {
  if (!compiled.locations.has(name)) compiled.locations.set(name, gl.getUniformLocation(compiled.program, name));
  return compiled.locations.get(name) ?? null;
}

export function setUniform(gl: WebGLRenderingContext, compiled: CompiledProgram, name: string, value: number | readonly number[]): void {
  const loc = location(gl, compiled, name);
  if (!loc) return;
  if (typeof value === "number") gl.uniform1f(loc, value);
  else if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
  else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
  else if (value.length === 4) gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
}

export function setUniforms(gl: WebGLRenderingContext, compiled: CompiledProgram, uniforms: GlslUniforms): void {
  for (const name in uniforms) setUniform(gl, compiled, name, uniforms[name]);
}

/** 采样器 uniform：绑定到第 unit 号纹理单元。 */
export function setSampler(gl: WebGLRenderingContext, compiled: CompiledProgram, name: string, unit: number): void {
  const loc = location(gl, compiled, name);
  if (loc) gl.uniform1i(loc, unit);
}
