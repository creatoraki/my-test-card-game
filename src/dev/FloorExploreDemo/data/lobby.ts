import type { RoomDef } from "../types";

/** 电梯厅: 出生点。红色应急灯 + 一根濒死的灯管, 两部电梯一开一关。 */
export const LOBBY: RoomDef = {
  id: "lobby",
  name: "电梯厅",
  width: 9,
  depth: 8,
  floor: "terrazzo",
  wallTint: 0xb9b4a6,
  mood: { sky: 0x3b2f36, ground: 0x0d0908, ambient: 0.55, dust: 0.55, fog: 0x5a3a3a, fogDensity: 0.55 },
  doors: [
    { id: "lobby-east", side: "x1", offset: 4, width: 1.5, to: { roomId: "office", doorId: "office-west" } },
    { id: "lobby-north", side: "z0", offset: 6.6, width: 1.5, to: { roomId: "stairwell", doorId: "stairwell-south" } },
  ],
  windows: [],
  props: [],
  decor: [
    { kind: "elevator", x: 0, z: 2.4, wall: "x0", variant: 1 },
    { kind: "elevator", x: 0, z: 5.5, wall: "x0", variant: 0 },
    { kind: "bench", x: 3.2, z: 0.45, rot: 0 },
    { kind: "plant", x: 0.55, z: 0.55 },
    { kind: "plant", x: 8.35, z: 7.4, variant: 1 },
    { kind: "counter", x: 7.35, z: 2.3, rot: Math.PI / 2, size: [2.4, 0.66], variant: 1 },
    { kind: "sign", x: 4.9, z: 5.1, rot: 0.7 },
    { kind: "debris", x: 3, z: 6.2, size: [1.8, 1.2] },
    { kind: "puddle", x: 5.8, z: 3.2, size: [2, 1.3] },
    { kind: "papers", x: 4.3, z: 3.9, size: [3.2, 2.6] },
    { kind: "boxes", x: 7.9, z: 6.4, rot: 0.3 },
    { kind: "glass", x: 2.3, z: 4.1, size: [1.2, 1] },
    { kind: "cable", x: 5.6, z: 5.8 },
    { kind: "pipes", x: 1.2, z: 0, wall: "z0" },
  ],
  lights: [
    { kind: "tube", x: 4.4, z: 4.1, flicker: "flicker", shadow: true, color: 0xd6e6ff, intensity: 34 },
    { kind: "emergency", x: 0.1, y: 2.55, z: 3.95, wall: "x0", color: 0xff2a14, intensity: 5, flicker: "pulse" },
    { kind: "emergency", x: 4.6, y: 2.55, z: 0.1, wall: "z0", color: 0xff3a1c, intensity: 3, flicker: "pulse" },
  ],
  guards: [],
  spawn: { x: 2.4, z: 4 },
  spawnYaw: Math.PI / 2,
};
