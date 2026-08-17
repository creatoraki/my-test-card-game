import { useEffect, useRef } from "react";
import { CINEMA } from "@/ui/battle/animations";
import type { Camera } from "./camera";
import { cameraCss, CAMERA_REST, CAMERA_REST_EPS } from "./camera";
import { Impulse, Spring, type SpringTuning } from "./spring";

export interface CameraRigRefs {
  sceneRef: React.RefObject<HTMLElement>;
  worldRef: React.RefObject<HTMLElement>;
  dofTargetsRef: React.MutableRefObject<Set<HTMLElement>>;
}

export interface CameraRigApi {
  setCamera(camera: Camera | null): void;
  snap(camera: Camera | null): void;
  punch(amount: number): void;
  impact(axis: { x: number; y: number }, amount: number, roll: number): void;
  setTuning(tuning: Partial<Record<keyof Camera, SpringTuning>> | null): void;
  setTimeScale(scale: number): void;
  getTimeScale(): number;
  onRestChange(callback: (rest: boolean) => void): () => void;
}

const DEFAULT_TUNING: Record<keyof Camera, SpringTuning> = {
  s: { stiffness: 150, damping: 22 },
  dx: { stiffness: 120, damping: 22 },
  dy: { stiffness: 120, damping: 22 },
  yaw: { stiffness: 110, damping: 18 },
  pitch: { stiffness: 110, damping: 18 },
  roll: { stiffness: 150, damping: 14 },
};

export function useCameraRig({ sceneRef, worldRef, dofTargetsRef }: CameraRigRefs): CameraRigApi {
  const targetRef = useRef<Camera>(CAMERA_REST);
  const tuningRef = useRef<Partial<Record<keyof Camera, SpringTuning>>>({});
  const timeScaleRef = useRef(1);
  const punchRef = useRef(0);
  const idleTimeRef = useRef(0);
  const restRef = useRef(false);
  const restListenersRef = useRef(new Set<(rest: boolean) => void>());
  const rafRef = useRef<number | null>(null);
  const wakeRef = useRef<() => void>(() => undefined);
  const mountedRef = useRef(false);
  const lastFrameRef = useRef(0);
  const dofRef = useRef<string | null>(null);
  const impulsesRef = useRef({ x: new Impulse(), y: new Impulse(), roll: new Impulse() });
  const springsRef = useRef<Record<keyof Camera, Spring> | null>(null);
  if (!springsRef.current) {
    springsRef.current = {
      s: new Spring(1), dx: new Spring(0), dy: new Spring(0), yaw: new Spring(0), pitch: new Spring(0), roll: new Spring(0),
    };
  }

  const apiRef = useRef<CameraRigApi | null>(null);
  const setRest = (rest: boolean) => {
    if (restRef.current === rest) return;
    restRef.current = rest;
    if (sceneRef.current) sceneRef.current.style.willChange = rest ? "auto" : "transform";
    if (worldRef.current) worldRef.current.style.willChange = rest ? "auto" : "transform";
    for (const callback of restListenersRef.current) callback(rest);
  };
  if (!apiRef.current) {
    apiRef.current = {
      setCamera(camera) {
        targetRef.current = camera ?? CAMERA_REST;
        wakeRef.current();
      },
      snap(camera) {
        const next = camera ?? CAMERA_REST;
        targetRef.current = next;
        for (const key of Object.keys(next) as (keyof Camera)[]) springsRef.current![key].snap(next[key]);
        wakeRef.current();
      },
      punch(amount) {
        punchRef.current = Math.max(punchRef.current, amount);
        wakeRef.current();
      },
      impact(axis, amount, roll) {
        impulsesRef.current.x.inject(axis.x * amount);
        impulsesRef.current.y.inject(axis.y * amount);
        impulsesRef.current.roll.inject(roll);
        wakeRef.current();
      },
      setTuning(tuning) {
        tuningRef.current = tuning ?? {};
        wakeRef.current();
      },
      setTimeScale(scale) {
        timeScaleRef.current = Math.max(0, scale);
        wakeRef.current();
      },
      getTimeScale() { return timeScaleRef.current; },
      onRestChange(callback) {
        restListenersRef.current.add(callback);
        callback(restRef.current);
        return () => restListenersRef.current.delete(callback);
      },
    };
  }

  useEffect(() => {
    mountedRef.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = (now: number) => {
      rafRef.current = null;
      if (!mountedRef.current || restRef.current) return;
      const wallDt = Math.min(1 / 30, (now - lastFrameRef.current) / 1000);
      const dt = wallDt * timeScaleRef.current;
      lastFrameRef.current = now;
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
      const impulseRollValue = impulsesRef.current.roll.step(dt);
      const impulseRoll = reduced ? 0 : impulseRollValue;
      const idleX = !reduced && target === CAMERA_REST ? Math.sin(idleTimeRef.current * 0.7) * CINEMA.idleDrift.x : 0;
      const idleY = !reduced && target === CAMERA_REST ? Math.cos(idleTimeRef.current * 0.53) * CINEMA.idleDrift.y : 0;
      const camera: Camera = {
        s: springs.s.value + punchRef.current,
        dx: springs.dx.value,
        dy: springs.dy.value,
        yaw: springs.yaw.value,
        pitch: springs.pitch.value,
        roll: springs.roll.value,
      };

      const cameraRest = (Object.keys(target) as (keyof Camera)[]).every(
        (key) => Math.abs(springs[key].value - target[key]) < CAMERA_REST_EPS && Math.abs(springs[key].velocity) < CAMERA_REST_EPS,
      );
      const impulsesRest = [impulsesRef.current.x, impulsesRef.current.y, impulsesRef.current.roll].every(
        (impulse) => Math.abs(impulse.value) < CAMERA_REST_EPS && Math.abs(impulse.velocity) < CAMERA_REST_EPS,
      );
      const idleRest = CINEMA.idleDrift.x === 0 && CINEMA.idleDrift.y === 0;
      if (cameraRest && Math.abs(punchRef.current) < CAMERA_REST_EPS && impulsesRest && idleRest) {
        for (const key of Object.keys(target) as (keyof Camera)[]) springs[key].snap(target[key]);
        punchRef.current = 0;
        for (const impulse of [impulsesRef.current.x, impulsesRef.current.y, impulsesRef.current.roll]) {
          impulse.value = 0;
          impulse.velocity = 0;
        }
        if (sceneRef.current) sceneRef.current.style.transform = cameraCss(camera);
        if (worldRef.current) worldRef.current.style.transform = "";
        const dof = String(Math.round(Math.max(0, Math.min(1, (camera.s - 1) / 0.8)) * 4) / 4);
        if (dofRef.current !== dof) {
          for (const target of dofTargetsRef.current) target.style.setProperty("--dof", dof);
          dofRef.current = dof;
        }
        setRest(true);
        return;
      }

      if (sceneRef.current) sceneRef.current.style.transform = cameraCss(camera);
      if (worldRef.current) worldRef.current.style.transform = `translate(${idleX + impulseX}px, ${idleY + impulseY}px) scale(${1 + punchRef.current * 0.12})`;
      const dof = String(Math.round(Math.max(0, Math.min(1, (camera.s - 1) / 0.8)) * 4) / 4);
      if (dofRef.current !== dof) {
        for (const target of dofTargetsRef.current) target.style.setProperty("--dof", dof);
        dofRef.current = dof;
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    wakeRef.current = () => {
      if (!mountedRef.current) return;
      if (sceneRef.current) sceneRef.current.style.willChange = "transform";
      if (worldRef.current) worldRef.current.style.willChange = "transform";
      setRest(false);
      if (rafRef.current === null) {
        lastFrameRef.current = performance.now();
        rafRef.current = requestAnimationFrame(frame);
      }
    };
    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      mountedRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      wakeRef.current = () => undefined;
    };
  }, [dofTargetsRef, sceneRef, worldRef]);

  return apiRef.current;
}
