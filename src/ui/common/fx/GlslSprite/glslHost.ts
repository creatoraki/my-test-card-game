import { compileProgram, createFullscreenTriangle, setUniform, setUniforms, type CompiledProgram } from "./glslProgram";
import type { GlslTarget, GlslTargetInit } from "./types";

/** 像素比上限：门类特效是柔和光效，1.5 倍已足够锐利。 */
const MAX_PIXEL_RATIO = 1.5;
/** 激活值平滑时间常数(秒)；约 0.4s 走完 95%。 */
const ACTIVE_TAU = 0.13;
/** uTime 回绕周期，避免长时间运行后浮点精度下降。 */
const TIME_WRAP = 3600;
/** 激活时动画相位的额外速度：激活后整体动画速度平滑提升到 2 倍。 */
const ACTIVE_SPEEDUP = 1;

/**
 * 共享 WebGL 宿主：全局只有一个离屏上下文，程序按 key 只编译一次；
 * 每帧依次把各目标绘制到离屏画布，再立即拷贝到目标自己的 2D 画布。
 * 这样切房间不会反复建上下文、反复编译着色器。
 */
class GlslHost {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private failed = false;
  private lost = false;
  private triangle: WebGLBuffer | null = null;
  private programs = new Map<string, CompiledProgram | null>();
  private targets = new Set<GlslTarget>();
  private byCanvas = new Map<Element, GlslTarget>();
  private observer: IntersectionObserver | null = null;
  private frame = 0;
  private lastTime = 0;

  /** 当前环境能否使用 WebGL；首次调用时创建共享上下文。 */
  available(): boolean {
    return this.ensureGl() !== null;
  }

  register(init: GlslTargetInit): GlslTarget | null {
    const ctx = init.canvas.getContext("2d");
    if (!ctx || !this.ensureGl()) return null;
    const on = init.active ? 1 : 0;
    const target: GlslTarget = {
      canvas: init.canvas,
      ctx,
      program: init.program,
      width: init.width,
      height: init.height,
      uniforms: init.uniforms,
      seed: init.seed,
      activeGoal: on,
      active: on,
      phase: 0,
      visible: true,
    };
    ctx.globalCompositeOperation = "copy";
    this.targets.add(target);
    this.byCanvas.set(init.canvas, target);
    this.ensureObserver()?.observe(init.canvas);
    this.program(init.program);
    this.start();
    return target;
  }

  unregister(target: GlslTarget): void {
    this.targets.delete(target);
    this.byCanvas.delete(target.canvas);
    this.observer?.unobserve(target.canvas);
  }

  setActive(target: GlslTarget, active: boolean): void {
    target.activeGoal = active ? 1 : 0;
  }

  private now(): number {
    return (performance.now() / 1000) % TIME_WRAP;
  }

  private ensureGl(): WebGLRenderingContext | null {
    if (this.gl) return this.gl;
    if (this.failed || typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      this.failed = true;
      return null;
    }
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.lost = true;
      this.programs.clear();
      this.triangle = null;
    });
    canvas.addEventListener("webglcontextrestored", () => {
      this.lost = false;
      this.setupState();
    });
    this.canvas = canvas;
    this.gl = gl;
    this.setupState();
    return gl;
  }

  private setupState(): void {
    const gl = this.gl;
    if (!gl) return;
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    this.triangle = createFullscreenTriangle(gl);
  }

  private ensureObserver(): IntersectionObserver | null {
    if (this.observer || typeof IntersectionObserver === "undefined") return this.observer;
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const target = this.byCanvas.get(entry.target);
        if (target) target.visible = entry.isIntersecting;
      }
    }, { rootMargin: "120px" });
    return this.observer;
  }

  private program(def: GlslTarget["program"]): CompiledProgram | null {
    const gl = this.gl;
    if (!gl || this.lost) return null;
    if (!this.programs.has(def.key)) this.programs.set(def.key, compileProgram(gl, def));
    return this.programs.get(def.key) ?? null;
  }

  private start(): void {
    if (this.frame) return;
    this.lastTime = this.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (): void => {
    this.frame = 0;
    if (this.targets.size === 0) return;
    const time = this.now();
    const dt = Math.min(0.1, Math.max(0, time - this.lastTime));
    this.lastTime = time;
    const ease = 1 - Math.exp(-dt / ACTIVE_TAU);
    for (const target of this.targets) {
      target.active += (target.activeGoal - target.active) * ease;
      // 相位按速度积分：变速只改变推进快慢，画面不会跳变。
      target.phase = (target.phase + dt * (1 + ACTIVE_SPEEDUP * target.active)) % TIME_WRAP;
      if (target.visible) this.draw(target, time);
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private draw(target: GlslTarget, time: number): void {
    const gl = this.gl;
    const canvas = this.canvas;
    if (!gl || !canvas || this.lost || !this.triangle) return;
    const compiled = this.program(target.program);
    if (!compiled) return;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const w = Math.max(1, Math.round(target.width * ratio));
    const h = Math.max(1, Math.round(target.height * ratio));
    if (target.canvas.width !== w || target.canvas.height !== h) {
      target.canvas.width = w;
      target.canvas.height = h;
      target.ctx.globalCompositeOperation = "copy";
    }
    // 离屏画布只增不减，按左下角视口绘制。
    if (canvas.width < w || canvas.height < h) {
      canvas.width = Math.max(canvas.width, w);
      canvas.height = Math.max(canvas.height, h);
    }
    gl.viewport(0, 0, w, h);
    gl.useProgram(compiled.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangle);
    gl.enableVertexAttribArray(compiled.aPos);
    gl.vertexAttribPointer(compiled.aPos, 2, gl.FLOAT, false, 0, 0);
    setUniform(gl, compiled, "uSize", [target.width, target.height]);
    setUniform(gl, compiled, "uTime", time);
    setUniform(gl, compiled, "uActive", target.active);
    setUniform(gl, compiled, "uPhase", target.phase);
    setUniform(gl, compiled, "uSeed", target.seed);
    setUniform(gl, compiled, "uAA", 1 / ratio);
    setUniforms(gl, compiled, target.uniforms);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    target.ctx.drawImage(canvas, 0, canvas.height - h, w, h, 0, 0, w, h);
  }
}

export const glslHost = new GlslHost();
