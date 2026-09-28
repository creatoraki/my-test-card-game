import { useEffect, useRef, useState } from "react";
import { glslHost } from "./glslHost";
import type { GlslProgramDef, GlslTarget, GlslUniforms } from "./types";
import s from "./GlslSprite.module.css";

/**
 * 由共享 WebGL 宿主驱动的程序化精灵。组件本身只挂一张 2D 画布；
 * active 变化只改宿主里的目标值，由宿主平滑过渡，不触发额外重渲染。
 * uniforms 需保持引用稳定(模块常量或 useMemo)。
 */
export function GlslSprite({ program, width, height, uniforms, active = false, seed = 0, className }: {
  program: GlslProgramDef;
  width: number;
  height: number;
  uniforms: GlslUniforms;
  active?: boolean;
  seed?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<GlslTarget | null>(null);
  const activeRef = useRef(active);
  const uniformsRef = useRef(uniforms);
  const [supported] = useState(() => glslHost.available());
  activeRef.current = active;
  uniformsRef.current = uniforms;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !supported) return;
    const target = glslHost.register({
      canvas,
      program,
      width,
      height,
      uniforms: uniformsRef.current,
      seed,
      active: activeRef.current,
    });
    targetRef.current = target;
    return () => {
      if (target) glslHost.unregister(target);
      targetRef.current = null;
    };
  }, [supported, program, width, height, seed]);

  useEffect(() => {
    if (targetRef.current) targetRef.current.uniforms = uniforms;
  }, [uniforms]);

  useEffect(() => {
    if (targetRef.current) glslHost.setActive(targetRef.current, active);
  }, [active]);

  if (!supported) {
    return <span aria-hidden className={`${s.fallback} ${active ? s.fallbackLit : ""} ${className ?? ""}`} style={{ width, height }} />;
  }
  return <canvas ref={canvasRef} aria-hidden className={`${s.canvas} ${className ?? ""}`} style={{ width, height }} />;
}
