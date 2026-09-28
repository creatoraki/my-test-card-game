import type { RoomDef } from "../../types";

/** ① 货运入口: 琥珀钠灯、卷帘门、破损天窗。起点房间, 没有守卫。 */
export const DOCK_ROOM: RoomDef = {
  id: "dock",
  name: "货运入口",
  zone: "dock",
  width: 4224,
  seed: 11.3,
  doors: [{ side: "right", to: "pump" }],
  props: [
    { id: "dock-safe", kind: "safe", x: 1560, z: 176, loot: "应急口粮 ×2" },
    { id: "dock-remains", kind: "remains", x: 3020, z: 118, loot: "探险日志残页" },
  ],
  decor: [
    { kind: "crates", x: 560, z: 70, scale: 1.1, seed: 1 },
    { kind: "pallet", x: 780, z: 120, seed: 2 },
    { kind: "barrel", x: 1180, z: 60, seed: 3 },
    { kind: "barrel", x: 1240, z: 84, scale: 0.94, seed: 4 },
    { kind: "cone", x: 1900, z: 250, seed: 5 },
    { kind: "cone", x: 1990, z: 262, seed: 6, flip: true },
    { kind: "crates", x: 2380, z: 60, scale: 1.25, seed: 7, flip: true },
    { kind: "debris", x: 2640, z: 230, seed: 8 },
    { kind: "spool", x: 3460, z: 96, seed: 9 },
    { kind: "pallet", x: 3720, z: 210, seed: 10, flip: true },
    { kind: "debris", x: 1420, z: 262, seed: 11 },
  ],
  guards: [],
  lights: [
    { x: 420, h: 360, z: 6, color: 0xffa24a, intensity: 2.4, radius: 720, flicker: "buzz" },
    { x: 1320, h: 372, z: 6, color: 0xffa24a, intensity: 2.6, radius: 760, flicker: "steady" },
    { x: 2240, h: 360, z: 6, color: 0xff9a40, intensity: 2.2, radius: 720, flicker: "broken" },
    { x: 3140, h: 372, z: 6, color: 0xffa24a, intensity: 2.5, radius: 760, flicker: "buzz" },
    { x: 3960, h: 360, z: 6, color: 0xffae5a, intensity: 2.0, radius: 700, flicker: "steady" },
    { x: 1760, h: 300, z: 150, color: 0x7fb6ff, intensity: 1.1, radius: 620, flicker: "steady" },
    { x: 3480, h: 300, z: 150, color: 0x7fb6ff, intensity: 1.0, radius: 600, flicker: "steady" },
  ],
  fx: [
    { kind: "drip", x: 1010, h: 430 },
    { kind: "drip", x: 2710, h: 430 },
    { kind: "sparks", x: 2240, h: 350, z: 6 },
  ],
  spawn: { x: 420, z: 170 },
};
