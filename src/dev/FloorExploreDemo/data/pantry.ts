import type { RoomDef } from "../types";

/** 茶水间: 唯一的主光源是那台还在苟延残喘的售货机。 */
export const PANTRY: RoomDef = {
  id: "pantry",
  name: "茶水间",
  width: 8,
  depth: 7,
  floor: "tile",
  wallTint: 0xc3c8bd,
  mood: { sky: 0x1f3a40, ground: 0x080b0b, ambient: 0.4, dust: 0.45, fog: 0x2d5a60, fogDensity: 0.5 },
  doors: [
    { id: "pantry-west", side: "x0", offset: 3.5, width: 1.5, to: { roomId: "office", doorId: "office-east" } },
  ],
  windows: [],
  props: [
    { id: "pantry-vending", kind: "vendingMachine", x: 5.7, z: 0.5, rot: 0 },
  ],
  decor: [
    { kind: "counter", x: 2.3, z: 0.36, rot: 0, size: [3.2, 0.66], variant: 0 },
    { kind: "water", x: 7.45, z: 0.4 },
    { kind: "table", x: 4.2, z: 4 },
    { kind: "chair", x: 3.1, z: 4.8, rot: 2, variant: 1 },
    { kind: "chair", x: 5.3, z: 3.3, rot: 4, variant: 1 },
    { kind: "chair", x: 4.9, z: 4.9, rot: 0.6, variant: 0 },
    { kind: "puddle", x: 5.5, z: 1.7, size: [1.8, 1] },
    { kind: "debris", x: 2.4, z: 2.3, size: [1.3, 1] },
    { kind: "papers", x: 3.6, z: 5.6, size: [2, 1.2] },
    { kind: "glass", x: 6.4, z: 2.2, size: [1.1, 0.8] },
    { kind: "plant", x: 7.4, z: 6.4, variant: 1 },
    { kind: "pipes", x: 0.5, z: 0, wall: "z0" },
  ],
  lights: [
    { kind: "tube", x: 3.8, z: 3.6, flicker: "dying", shadow: true, color: 0xcfe0f0, intensity: 16 },
  ],
  guards: [],
  spawn: { x: 1.2, z: 3.5 },
  spawnYaw: Math.PI / 2,
};
