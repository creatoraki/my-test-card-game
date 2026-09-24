import type { RoomDef } from "../types";

/** 消防楼梯间: 通往上层的楼梯被警戒带封死, 平台上立着一道黑影。 */
export const STAIRWELL: RoomDef = {
  id: "stairwell",
  name: "消防楼梯间",
  width: 7,
  depth: 7,
  floor: "concrete",
  wallTint: 0x9ea99f,
  mood: { sky: 0x1d3a2c, ground: 0x070a08, ambient: 0.45, dust: 0.6, fog: 0x2e5a44, fogDensity: 0.6 },
  doors: [
    { id: "stairwell-south", side: "z1", offset: 4.6, width: 1.5, to: { roomId: "lobby", doorId: "lobby-north" } },
    { id: "stairwell-east", side: "x1", offset: 3.6, width: 1.5, to: { roomId: "archive", doorId: "archive-west" } },
  ],
  windows: [],
  props: [],
  decor: [
    { kind: "stairs", x: 1.3, z: 2.75, size: [2, 4.3] },
    { kind: "tape", x: 1.3, z: 5.05, rot: 0, size: [2.2, 0] },
    { kind: "tape", x: 2.45, z: 3.4, rot: Math.PI / 2, size: [2.4, 0] },
    { kind: "extinguisher", x: 4.1, z: 5.4, rot: 1.1 },
    { kind: "debris", x: 4.6, z: 2.1, size: [1.8, 1.5] },
    { kind: "puddle", x: 3.8, z: 4, size: [1.6, 1.1] },
    { kind: "boxes", x: 6.2, z: 0.8, rot: 0.3 },
    { kind: "pipes", x: 5.2, z: 0, wall: "z0" },
    { kind: "papers", x: 4.6, z: 5.8, size: [1.6, 1] },
  ],
  lights: [
    { kind: "tube", x: 3.9, z: 3.5, flicker: "dying", shadow: true, color: 0xd2e8da, intensity: 18 },
    { kind: "exit", x: 3.9, y: 2.35, z: 0.1, wall: "z0", color: 0x2cff7a, intensity: 4 },
  ],
  guards: [
    // 站在楼梯半截(楼梯自 z=4.9 起步, 第 8 级踏步顶面高 1.41m)。
    { id: "stair-watcher", path: [{ x: 1.3, z: 3.35 }], y: 1.41, facing: 0.35 },
  ],
  spawn: { x: 4.6, z: 5.8 },
  spawnYaw: Math.PI,
};
