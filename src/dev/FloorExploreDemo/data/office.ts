import type { RoomDef } from "../types";

/** 开放办公区: 最大的房间。冷白灯管坏了一半, 工位之间有黑影巡逻。 */
export const OFFICE: RoomDef = {
  id: "office",
  name: "开放办公区",
  width: 13,
  depth: 10,
  floor: "carpet",
  wallTint: 0xa9b3b3,
  mood: { sky: 0x2c3a46, ground: 0x0a0c0d, ambient: 0.5, dust: 0.7, fog: 0x3c4f5c, fogDensity: 0.6 },
  doors: [
    { id: "office-west", side: "x0", offset: 4, width: 1.5, to: { roomId: "lobby", doorId: "lobby-east" } },
    { id: "office-east", side: "x1", offset: 5, width: 1.5, to: { roomId: "pantry", doorId: "pantry-west" } },
    { id: "office-north", side: "z0", offset: 9.6, width: 1.5, to: { roomId: "archive", doorId: "archive-south" } },
  ],
  windows: [],
  props: [
    { id: "office-cabinet", kind: "filingCabinet", x: 0.85, z: 7.8, rot: Math.PI / 2 },
  ],
  decor: [
    // 前排工位(两两相对, 中间一道隔板)
    { kind: "desk", x: 4, z: 6.45, rot: Math.PI, variant: 0 },
    { kind: "desk", x: 5.45, z: 6.45, rot: Math.PI, variant: 1 },
    { kind: "desk", x: 4, z: 7.25, rot: 0, variant: 2 },
    { kind: "desk", x: 5.45, z: 7.25, rot: 0, variant: 1 },
    { kind: "partition", x: 4.72, z: 6.85, size: [3, 0.1] },
    { kind: "desk", x: 8.6, z: 6.45, rot: Math.PI, variant: 2 },
    { kind: "desk", x: 10.05, z: 6.45, rot: Math.PI, variant: 0 },
    { kind: "desk", x: 8.6, z: 7.25, rot: 0, variant: 1 },
    { kind: "partition", x: 9.32, z: 6.85, size: [3, 0.1] },
    // 后排工位
    { kind: "desk", x: 8.6, z: 2.8, rot: Math.PI, variant: 1 },
    { kind: "desk", x: 10.05, z: 2.8, rot: Math.PI, variant: 2 },
    { kind: "desk", x: 8.6, z: 3.6, rot: 0, variant: 0 },
    { kind: "desk", x: 10.05, z: 3.6, rot: 0, variant: 1 },
    { kind: "partition", x: 9.32, z: 3.2, size: [3, 0.1] },
    // 翻倒的椅子与杂物
    { kind: "chair", x: 3.3, z: 5.2, rot: 1.2, variant: 1 },
    { kind: "chair", x: 6.6, z: 8.3, rot: 2.5, variant: 1 },
    { kind: "chair", x: 9.4, z: 4.5, rot: 0.4, variant: 0 },
    { kind: "chair", x: 11.2, z: 7.4, rot: -2.2, variant: 1 },
    { kind: "boxes", x: 1.2, z: 1.1, rot: 0.2 },
    { kind: "boxes", x: 2.2, z: 0.6, rot: -0.3, variant: 1 },
    { kind: "plant", x: 12.4, z: 0.6, variant: 1 },
    { kind: "board", x: 4.4, z: 0, wall: "z0" },
    { kind: "papers", x: 6.6, z: 5.2, size: [6, 3.2] },
    { kind: "papers", x: 2.2, z: 7.8, size: [1.8, 2.2] },
    { kind: "debris", x: 5.2, z: 2.3, size: [2.2, 1.6] },
    { kind: "cable", x: 6.4, z: 2.4 },
    { kind: "puddle", x: 10.6, z: 8.8, size: [2.2, 1] },
    { kind: "glass", x: 12, z: 3.2, size: [1, 1.4] },
    { kind: "pipes", x: 12.2, z: 0, wall: "z0" },
  ],
  lights: [
    { kind: "tube", x: 4.7, z: 3.1, flicker: "steady", shadow: true, color: 0xdbeaff, intensity: 30 },
    { kind: "tube", x: 9.3, z: 5.2, flicker: "off" },
    { kind: "tube", x: 4.7, z: 7.9, flicker: "flicker", color: 0xd0e2ff, intensity: 26 },
    { kind: "tube", x: 9.3, z: 8.4, flicker: "dying", shadow: true, color: 0xc6dcff, intensity: 22 },
    { kind: "lamp", x: 10.2, y: 0.78, z: 6.3, color: 0xffa860, intensity: 5, flicker: "steady" },
  ],
  guards: [
    { id: "office-patrol", path: [{ x: 11.6, z: 5 }, { x: 7, z: 5 }, { x: 7, z: 8.9 }, { x: 11.6, z: 8.9 }], speed: 0.9, pause: 1.6 },
  ],
  spawn: { x: 1.3, z: 4 },
  spawnYaw: Math.PI / 2,
};
