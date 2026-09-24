import type { RoomDef } from "../types";

/** 档案室: 月光穿窗, 铁架之间站着一道不动的黑影; 墙角坐着先来的人。 */
export const ARCHIVE: RoomDef = {
  id: "archive",
  name: "档案室",
  width: 11,
  depth: 9,
  floor: "concrete",
  wallTint: 0x9fa6ad,
  mood: { sky: 0x25324a, ground: 0x07080b, ambient: 0.45, dust: 1, fog: 0x3a4a6a, fogDensity: 0.75 },
  doors: [
    { id: "archive-south", side: "z1", offset: 9.6, width: 1.5, to: { roomId: "office", doorId: "office-north" } },
    { id: "archive-west", side: "x0", offset: 4.5, width: 1.5, to: { roomId: "stairwell", doorId: "stairwell-east" } },
  ],
  windows: [
    { side: "z0", offset: 2.6, width: 1.7, bottom: 1, top: 2.5 },
    { side: "z0", offset: 7.6, width: 1.7, bottom: 1, top: 2.5 },
  ],
  props: [
    { id: "archive-remains", kind: "remains", x: 5.1, z: 0.62, rot: 0 },
  ],
  decor: [
    { kind: "shelf", x: 5.9, z: 4.2, variant: 0 },
    { kind: "shelf", x: 8, z: 4.2, variant: 1 },
    { kind: "shelf", x: 5.9, z: 6.4, rot: Math.PI, variant: 2 },
    { kind: "shelf", x: 8, z: 6.4, rot: Math.PI, variant: 0 },
    { kind: "shelf", x: 1.1, z: 7.6, rot: Math.PI / 2, variant: 1 },
    { kind: "boxes", x: 9.9, z: 1, rot: 0.1 },
    { kind: "boxes", x: 10.2, z: 2.1, rot: -0.4, variant: 1 },
    { kind: "boxes", x: 3.3, z: 6.2, rot: 0.8 },
    { kind: "papers", x: 4.4, z: 2.6, size: [4, 2.4] },
    { kind: "papers", x: 7, z: 5.3, size: [4, 1] },
    { kind: "debris", x: 2.3, z: 3.6, size: [1.6, 1.4] },
    { kind: "glass", x: 2.6, z: 1.3, size: [1.4, 0.9] },
    { kind: "glass", x: 7.6, z: 1.3, size: [1.4, 0.9] },
    { kind: "puddle", x: 7.2, z: 2.3, size: [1.8, 1.2] },
    { kind: "cable", x: 3.9, z: 5 },
  ],
  lights: [
    { kind: "moon", x: 2.2, y: 4, z: -4.2, target: [3.4, 0, 3.4], shadow: true, color: 0x8fb0ff, intensity: 3.4 },
    { kind: "moon", x: 7.2, y: 4, z: -4.2, target: [8.2, 0, 3.4], color: 0x86a6f5, intensity: 2.4 },
    { kind: "emergency", x: 0.1, y: 2.5, z: 2.3, wall: "x0", color: 0xff3018, intensity: 3.5, flicker: "pulse" },
  ],
  guards: [
    { id: "archive-watcher", path: [{ x: 7, z: 5.3 }], facing: Math.PI * 0.25 },
  ],
  spawn: { x: 9.6, z: 7.8 },
  spawnYaw: Math.PI,
};
