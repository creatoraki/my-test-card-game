import type { RoomDef } from "../types";

/** ④ 数据机房: 冷蓝、机柜指示灯、玻璃墙后的全息数据瀑布。 */
export const SERVER_ROOM: RoomDef = {
  id: "server",
  name: "数据机房",
  zone: "server",
  width: 4224,
  seed: 58.4,
  doors: [{ side: "down", to: "pump", x: 2112 }],
  props: [
    { id: "server-safe", kind: "safe", x: 1380, z: 112, loot: "加密存储芯片" },
    { id: "server-remains", kind: "remains", x: 3160, z: 196, loot: "冷凝药剂", flip: true },
  ],
  decor: [
    { kind: "spool", x: 640, z: 180, seed: 1 },
    { kind: "debris", x: 1000, z: 250, seed: 2 },
    { kind: "crates", x: 2620, z: 64, seed: 3, scale: 0.85 },
    { kind: "debris", x: 3600, z: 90, seed: 4 },
    { kind: "cone", x: 1900, z: 262, seed: 5 },
  ],
  guards: [],
  lights: [
    { x: 380, h: 380, z: 10, color: 0x6ab4ff, intensity: 2.0, radius: 720, flicker: "steady" },
    { x: 1260, h: 380, z: 10, color: 0x6ab4ff, intensity: 2.2, radius: 740, flicker: "steady" },
    { x: 2112, h: 380, z: 10, color: 0x9ad0ff, intensity: 2.4, radius: 760, flicker: "buzz" },
    { x: 2980, h: 380, z: 10, color: 0x6ab4ff, intensity: 2.1, radius: 740, flicker: "broken" },
    { x: 3860, h: 380, z: 10, color: 0x6ab4ff, intensity: 2.0, radius: 720, flicker: "steady" },
    { x: 1700, h: 60, z: 200, color: 0x40d8ff, intensity: 0.9, radius: 420, flicker: "pulse" },
    { x: 3500, h: 60, z: 110, color: 0x40d8ff, intensity: 0.8, radius: 420, flicker: "pulse" },
  ],
  fx: [
    { kind: "sparks", x: 2980, h: 380, z: 10 },
  ],
  spawn: { x: 2112, z: 230 },
};
