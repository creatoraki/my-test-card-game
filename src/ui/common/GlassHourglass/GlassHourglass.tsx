import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { createHourglassScene, type HourglassScene } from "./hourglassScene";
import s from "./GlassHourglass.module.css";

export interface GlassHourglassProps {
  color: string;
  intensity?: number;
  width?: number;
  height?: number;
  paused?: boolean;
  className?: string;
}

export function GlassHourglass({
  color,
  intensity = 1,
  width = 180,
  height = 250,
  paused = false,
  className,
}: GlassHourglassProps) {
  const reduced = useMemo(prefersReducedMotion, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HourglassScene | null>(null);
  const colorRef = useRef(color);
  const intensityRef = useRef(Math.max(0, intensity));
  const pausedRef = useRef(paused);
  const syncRunningRef = useRef<(() => void) | null>(null);

  colorRef.current = color;
  intensityRef.current = Math.max(0, intensity);
  pausedRef.current = paused;

  useEffect(() => {
    syncRunningRef.current?.();
  }, [paused]);

  useEffect(() => {
    if (!reduced) return;
    const scene = sceneRef.current;
    if (!scene) return;
    scene.update({
      time: 0,
      dt: 0,
      color: colorRef.current,
      intensity: intensityRef.current,
      staticFrame: true,
    });
    scene.render();
  }, [color, intensity, reduced]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const scene = createHourglassScene(canvas, colorRef.current);
    sceneRef.current = scene;
    let dirty = true;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;

    const layout = () => {
      const rect = root.getBoundingClientRect();
      if (!(rect.width > 0 && rect.height > 0)) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      scene.layout(rect.width, rect.height, dpr);
      dirty = false;
    };

    const drawStatic = () => {
      if (dirty) layout();
      scene.update({
        time: 0,
        dt: 0,
        color: colorRef.current,
        intensity: intensityRef.current,
        staticFrame: true,
      });
      scene.render();
    };

    const resizeObserver = new ResizeObserver(() => {
      dirty = true;
      if (reduced) drawStatic();
    });
    resizeObserver.observe(root);

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
      if (reduced || raf || pausedRef.current || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const syncRunning = () => {
      if (reduced || pausedRef.current || document.hidden) stop();
      else start();
    };
    const onVisibility = () => syncRunning();

    syncRunningRef.current = syncRunning;
    document.addEventListener("visibilitychange", onVisibility);
    if (reduced) drawStatic();
    else syncRunning();

    return () => {
      syncRunningRef.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
      stop();
      sceneRef.current = null;
      scene.dispose();
    };
  }, [reduced]);

  const rootClass = cx(s.root, className);
  const rootStyle = {
    "--hourglass-width": `${Math.max(1, width)}px`,
    "--hourglass-height": `${Math.max(1, height)}px`,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} className={rootClass} style={rootStyle} aria-hidden="true">
      <canvas ref={canvasRef} className={s.canvas} />
    </div>
  );
}