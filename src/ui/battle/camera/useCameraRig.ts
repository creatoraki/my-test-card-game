import { useEffect, useRef } from "react";
import type { Camera } from "./camera";
import { cameraCss, CAMERA_REST } from "./camera";
import { Impulse, Spring, type SpringTuning } from "./spring";

export interface CameraRigRefs {
  sceneRef: React.RefObject<HTMLElement>;
  worldRef: React.RefObject<HTMLElement>;
  screenRef: React.RefObject<HTMLElement>;
}

export interface CameraRigApi {
  setCamera(camera: Camera | null): void;
  snap(camera: Camera | null): void;
  punch(amount: number): void;
  impact(axis: { x: number; y: number }, amount: number, roll: number): void;
  setTuning(tuning: Partial<Record<keyof Camera, SpringTuning>> | null): void;
  setTimeScale(scale: number): void;
  setFxRate(rate: number): void;
  getTimeScale(): number;
}

const DEFAULT_TUNING: Record<keyof Camera, SpringTuning> = {
  s: { stiffness: 150, damping: 22 },
  dx: { stiffness: 120, damping: 22 },
  dy: { stiffness: 120, damping: 22 },
  yaw: { stiffness: 110, damping: 18 },
  pitch: { stiffness: 110, damping: 18 },
  roll: { stiffness: 150, damping: 14 },
};

export function useCameraRig({ sceneRef, worldRef, screenRef }: CameraRigRefs): CameraRigApi {
  const targetRef = useRef<Camera>(CAMERA_REST);
  const tuningRef = useRef<Partial<Record<keyof Camera, SpringTuning>>>({});
  const timeScaleRef = useRef(1);
  const fxRateRef = useRef(1);
  const punchRef = useRef(0);
  const idleTimeRef = useRef(0);
  const impulsesRef = useRef({ x: new Impulse(), y: new Impulse(), roll: new Impulse() });
  const springsRef = useRef<Record<keyof Camera, Spring> | null>(null);
  if (!springsRef.current) {
    springsRef.current = {
      s: new Spring(1), dx: new Spring(0), dy: new Spring(0), yaw: new Spring(0), pitch: new Spring(0), roll: new Spring(0),
    };
  }

  const apiRef = useRef<CameraRigApi | null>(null);
  if (!apiRef.current) {
    apiRef.current = {
      setCamera(camera) { targetRef.current = camera ?? CAMERA_REST; },
      snap(camera) {
        const next = camera ?? CAMERA_REST;
        targetRef.current = next;
        for (const key of Object.keys(next) as (keyof Camera)[]) springsRef.current![key].snap(next[key]);
      },
      punch(amount) { punchRef.current = Math.max(punchRef.current, amount); },
      impact(axis, amount, roll) {
        impulsesRef.current.x.inject(axis.x * amount);
        impulsesRef.current.y.inject(axis.y * amount);
        impulsesRef.current.roll.inject(roll);
      },
      setTuning(tuning) { tuningRef.current = tuning ?? {}; },
      setTimeScale(scale) { timeScaleRef.current = Math.max(0, scale); },
      setFxRate(rate) { fxRateRef.current = Math.max(0.25, rate); },
      getTimeScale() { return timeScaleRef.current; },
    };
  }

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = (now: number) => {
      const wallDt = Math.min(1 / 30, (now - last) / 1000);
      const dt = wallDt * timeScaleRef.current;
      last = now;
      idleTimeRef.current += wallDt;
      const springs = springsRef.current!;
      const target = targetRef.current;
      for (const key of Object.keys(target) as (keyof Camera)[]) {
        const tuning = { ...DEFAULT_TUNING[key], ...(tuningRef.current[key] ?? {}) };
        if (key === "roll" && reduced) tuning.damping = 30;
        springs[key].step(target[key], dt, tuning);
      }
      punchRef.current *= Math.exp(-dt * 18);
      const impulseX = impulsesRef.current.x.step(dt);
      const impulseY = impulsesRef.current.y.step(dt);
      const impulseRoll = reduced ? 0 : impulsesRef.current.roll.step(dt);
      const idleX = !reduced && target === CAMERA_REST ? Math.sin(idleTimeRef.current * 0.7) * 2.5 : 0;
      const idleY = !reduced && target === CAMERA_REST ? Math.cos(idleTimeRef.current * 0.53) * 1.5 : 0;
      const camera: Camera = {
        s: springs.s.value + punchRef.current,
        dx: springs.dx.value,
        dy: springs.dy.value,
        yaw: springs.yaw.value,
        pitch: springs.pitch.value,
        roll: springs.roll.value,
      };
      if (sceneRef.current) sceneRef.current.style.transform = cameraCss(camera);
      if (worldRef.current) worldRef.current.style.transform = `translate(${idleX + impulseX}px, ${idleY + impulseY}px) scale(${1 + punchRef.current * 0.12})`;
      if (screenRef.current) {
        screenRef.current.style.setProperty("--dof", String(Math.max(0, Math.min(1, (camera.s - 1) / 0.8))));
        screenRef.current.style.setProperty("--fx-rate", String(fxRateRef.current));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [sceneRef, screenRef, worldRef]);

  return apiRef.current;
}
