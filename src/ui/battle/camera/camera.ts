import { CINEMA } from "@/ui/battle/animations";
import { STAGE } from "@/ui/hooks/stage";

export interface Camera {
  s: number;
  dx: number;
  dy: number;
  yaw: number;
  pitch: number;
  roll: number;
}

export const CAMERA_REST: Camera = { s: 1, dx: 0, dy: 0, yaw: 0, pitch: 0, roll: 0 };
export const CAMERA_REST_EPS = 0.001;
export const AXIS = { x: STAGE.width / 2, y: STAGE.height / 2 };

export function worldShift(A: { x: number; y: number }, F: { x: number; y: number }, s: number) {
  return {
    dx: (A.x - AXIS.x) / s + AXIS.x - F.x,
    dy: (A.y - AXIS.y) / s + AXIS.y - F.y,
  };
}

export function cameraCss(camera: Camera): string {
  if (Object.keys(CAMERA_REST).every((key) => Math.abs(camera[key as keyof Camera] - CAMERA_REST[key as keyof Camera]) < CAMERA_REST_EPS)) {
    return "none";
  }
  const z = CINEMA.perspective * (1 - 1 / camera.s);
  return `translateZ(${z}px) rotateY(${camera.yaw}deg) rotateX(${camera.pitch}deg) rotateZ(${camera.roll}deg) translate(${camera.dx}px, ${camera.dy}px)`;
}

export function depthVars(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, z] of Object.entries(CINEMA.depth)) {
    out[`--depth-${key}`] = `${z}px`;
    out[`--depth-${key}-fix`] = `${(CINEMA.perspective - z) / CINEMA.perspective}`;
  }
  return out;
}

export function sameCamera(a: Camera | null, b: Camera | null): boolean {
  return a === b || (!!a && !!b && Object.keys(CAMERA_REST).every((key) => a[key as keyof Camera] === b[key as keyof Camera]));
}
