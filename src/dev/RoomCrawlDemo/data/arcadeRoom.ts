import type { RoomDef } from "../types";

/** ③ 霓虹旧商场: 品红与青色霓虹、坏掉的扶梯、垂挂横幅、满地碎玻璃。 */
export const ARCADE_ROOM: RoomDef = {
  id: "arcade",
  name: "霓虹旧商场",
  zone: "arcade",
  width: 5376,
  seed: 43.1,
  doors: [
    { side: "left", to: "pump" },
    { side: "down", to: "core", x: 4040 },
  ],
  props: [
    { id: "arcade-vending-a", kind: "vending", x: 1060, z: 76, loot: "霓虹代币 ×3" },
    { id: "arcade-vending-b", kind: "vending", x: 2980, z: 80, loot: "过期能量饮料", flip: true },
    { id: "arcade-remains", kind: "remains", x: 4700, z: 168, loot: "褪色的会员卡" },
  ],
  decor: [
    { kind: "debris", x: 620, z: 220, seed: 1 },
    { kind: "cone", x: 1560, z: 250, seed: 2 },
    { kind: "crates", x: 1900, z: 60, seed: 3, scale: 0.9 },
    { kind: "debris", x: 2400, z: 150, seed: 4 },
    { kind: "barrel", x: 3500, z: 64, seed: 5 },
    { kind: "debris", x: 3800, z: 250, seed: 6 },
    { kind: "pallet", x: 4300, z: 70, seed: 7 },
    { kind: "cone", x: 3880, z: 262, seed: 8, flip: true },
  ],
  guards: [
    { id: "arcade-shade", patrol: [{ x: 1900, z: 200 }, { x: 2700, z: 120 }, { x: 3700, z: 210 }, { x: 4300, z: 130 }] },
  ],
  lights: [
    { x: 520, h: 300, z: 6, color: 0xff3fc8, intensity: 2.4, radius: 680, flicker: "buzz" },
    { x: 1300, h: 320, z: 6, color: 0x38e8ff, intensity: 2.3, radius: 700, flicker: "steady" },
    { x: 2100, h: 300, z: 6, color: 0xff3fc8, intensity: 2.5, radius: 680, flicker: "broken" },
    { x: 2860, h: 320, z: 6, color: 0x9a5cff, intensity: 2.0, radius: 660, flicker: "buzz" },
    { x: 3620, h: 300, z: 6, color: 0x38e8ff, intensity: 2.4, radius: 700, flicker: "steady" },
    { x: 4380, h: 320, z: 6, color: 0xff3fc8, intensity: 2.3, radius: 680, flicker: "broken" },
    { x: 5040, h: 300, z: 6, color: 0x38e8ff, intensity: 2.0, radius: 660, flicker: "buzz" },
    { x: 2500, h: 330, z: 170, color: 0xffe0f4, intensity: 0.8, radius: 560, flicker: "pulse" },
  ],
  fx: [
    { kind: "sparks", x: 2100, h: 300, z: 6 },
    { kind: "sparks", x: 4380, h: 320, z: 6 },
    { kind: "embers", x: 2700, width: 5200 },
  ],
  spawn: { x: 400, z: 150 },
};
