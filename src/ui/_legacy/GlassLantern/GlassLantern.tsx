import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { createLanternScene, type LanternScene } from "./lanternScene";
import s from "./GlassLantern.module.css";

export interface GlassLanternProps {
  color: string;
  intensity?: number;
  size?: number;
  paused?: boolean;
  fallbackSrc?: string;
  className?: string;
}

const CANVAS_PAD = 28;

export function GlassLantern({
  color,
  intensity = 2,
  size = 160,
  paused = false,
  fallbackSrc,
  className,
}: GlassLanternProps) {
  const [failed, setFailed] = useState(false);
  const reduced = useMemo(prefersReducedMotion, []);
  const supported = useMemo(hasWebGL, []);
  const fail = useCallback(() => setFailed(true), []);
  const rootClass = cx(s.root, className);
  const rootStyle = { "--lantern-size": `${Math.max(1, size)}px` } as React.CSSProperties;

  if (reduced || !supported || failed) {
    if (!fallbackSrc) return null;
    return (
      <div className={rootClass} style={rootStyle} aria-hidden="true">
        <img className={s.fallback} src={fallbackSrc} alt="" draggable={false} />
      </div>
    );
  }

  return (
    <LanternCanvas
      color={color}
      intensity={intensity}
      size={size}
      paused={paused}
      className={rootClass}
      style={rootStyle}
      onFail={fail}
    />
  );
}

function LanternCanvas({
  color,
  intensity,
  size,
  paused,
  className,
  style,
  onFail,
}: GlassLanternProps & {
  className: string;
  style: React.CSSProperties;
  onFail: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(color);
  const intensityRef = useRef(Math.max(0.1, intensity ?? 2));
  const sizeRef = useRef(Math.max(1, size ?? 160));
  const pausedRef = useRef(paused ?? false);
  const syncRunningRef = useRef<(() => void) | null>(null);

  colorRef.current = color;
  intensityRef.current = Math.max(0.1, intensity ?? 2);
  sizeRef.current = Math.max(1, size ?? 160);
  pausedRef.current = paused ?? false;

  useEffect(() => {
    syncRunningRef.current?.();
  }, [paused]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    let scene: LanternScene;
    try {
      scene = createLanternScene(canvas, colorRef.current);
    } catch {
      onFail();
      return;
    }

    let dirty = true;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const resizeObserver = new ResizeObserver(() => {
      dirty = true;
    });
    resizeObserver.observe(root);

    const layout = () => {
      const width = root.getBoundingClientRect().width;
      const designSize = sizeRef.current;
      if (!(width > 0)) return;
      scene.layout(designSize, Math.max(0.1, width / designSize), CANVAS_PAD);
      dirty = false;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      elapsed += dt;
      if (dirty) layout();
      scene.update({
        time: elapsed,
        dt,
        color: colorRef.current,
        intensity: intensityRef.current,
      });
      scene.render();
    };

    const start = () => {
      if (raf || pausedRef.current || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const syncRunning = () => {
      if (pausedRef.current || document.hidden) stop();
      else start();
    };
    const onVisibility = () => syncRunning();

    syncRunningRef.current = syncRunning;
    document.addEventListener("visibilitychange", onVisibility);
    syncRunning();

    const onContextLost = (event: Event) => {
      event.preventDefault();
      stop();
      onFail();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      syncRunningRef.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      resizeObserver.disconnect();
      stop();
      scene.dispose();
    };
  }, [onFail]);

  return (
    <div ref={rootRef} className={className} style={style} aria-hidden="true">
      <canvas ref={canvasRef} className={s.canvas} />
    </div>
  );
}

function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}
