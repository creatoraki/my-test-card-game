import type { RoomDef } from "../types";

/** ② 泵站管廊: 青绿水光、巨型管道与阀门、滴水的管廊。楼层的交通枢纽。 */
export const PUMP_ROOM: RoomDef = {
  id: "pump",
  name: "泵站管廊",
  subtitle: "管道还在呼吸, 地下的水声从未停过",
  zone: "pump",
  width: 4992,
  seed: 27.9,
  grid: { col: 1, row: 1 },
  doors: [
    { side: "left", to: "dock" },
    { side: "right", to: "arcade" },
    { side: "up", to: "server", x: 2560 },
  ],
  props: [
    { id: "pump-vending", kind: "vending", x: 1320, z: 84, loot: "旧式电池 ×3" },
    { id: "pump-safe", kind: "safe", x: 3860, z: 204, loot: "密封绷带 ×2", flip: true },
  ],
  decor: [
    { kind: "barrel", x: 700, z: 70, seed: 1 },
    { kind: "spool", x: 900, z: 214, seed: 2 },
    { kind: "debris", x: 1780, z: 240, seed: 3 },
    { kind: "barrel", x: 3180, z: 58, seed: 4, scale: 1.05 },
    { kind: "barrel", x: 3240, z: 80, seed: 5, scale: 0.9 },
    { kind: "crates", x: 4420, z: 70, seed: 6 },
    { kind: "cone", x: 2380, z: 44, seed: 7 },
    { kind: "cone", x: 2740, z: 44, seed: 8, flip: true },
    { kind: "debris", x: 4100, z: 110, seed: 9 },
  ],
  guards: [
    { id: "pump-shade", patrol: [{ x: 2060, z: 120 }, { x: 3020, z: 200 }, { x: 3500, z: 110 }] },
  ],
  lights: [
    { x: 380, h: 330, z: 8, color: 0x46f0c8, intensity: 2.0, radius: 700, flicker: "steady" },
    { x: 1260, h: 350, z: 8, color: 0x46f0c8, intensity: 2.2, radius: 720, flicker: "buzz" },
    { x: 2560, h: 400, z: 4, color: 0x80fff0, intensity: 2.6, radius: 700, flicker: "pulse" },
    { x: 3300, h: 340, z: 8, color: 0x3fe6c0, intensity: 2.0, radius: 720, flicker: "broken" },
    { x: 4300, h: 340, z: 8, color: 0x46f0c8, intensity: 2.1, radius: 720, flicker: "steady" },
    { x: 1880, h: 280, z: 160, color: 0xffb070, intensity: 1.2, radius: 520, flicker: "buzz" },
    { x: 3900, h: 280, z: 160, color: 0xffb070, intensity: 1.1, radius: 520, flicker: "steady" },
  ],
  fx: [
    { kind: "drip", x: 1560, h: 430 },
    { kind: "drip", x: 2960, h: 430 },
    { kind: "drip", x: 4480, h: 430 },
  ],
  spawn: { x: 400, z: 150 },
};
