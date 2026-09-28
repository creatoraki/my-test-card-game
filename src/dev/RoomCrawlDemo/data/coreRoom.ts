import type { RoomDef } from "../types";

/** ⑤ 冷却核心: 红黑、旋转警报灯、巨型风扇、墙面蔓延的黑色腐化触须。两名守卫。 */
export const CORE_ROOM: RoomDef = {
  id: "core",
  name: "冷却核心",
  zone: "core",
  width: 4608,
  seed: 71.7,
  doors: [{ side: "up", to: "arcade", x: 2304 }],
  props: [
    { id: "core-remains", kind: "remains", x: 1240, z: 150, loot: "黑色结晶碎片" },
    { id: "core-safe", kind: "safe", x: 3700, z: 96, loot: "核心检修钥匙卡", flip: true },
  ],
  decor: [
    { kind: "barrel", x: 600, z: 66, seed: 1 },
    { kind: "debris", x: 900, z: 240, seed: 2 },
    { kind: "spool", x: 2000, z: 230, seed: 3, flip: true },
    { kind: "debris", x: 2800, z: 120, seed: 4 },
    { kind: "crates", x: 4200, z: 70, seed: 5 },
    { kind: "barrel", x: 3000, z: 60, seed: 6, scale: 1.1 },
  ],
  guards: [
    { id: "core-shade-a", patrol: [{ x: 1700, z: 90 }, { x: 2700, z: 230 }] },
    { id: "core-shade-b", patrol: [{ x: 3100, z: 230 }, { x: 4100, z: 110 }, { x: 3500, z: 160 }] },
  ],
  lights: [
    { x: 520, h: 380, z: 8, color: 0xff2a1a, intensity: 2.6, radius: 760, flicker: "alarm" },
    { x: 1600, h: 380, z: 8, color: 0xff3a22, intensity: 2.2, radius: 720, flicker: "broken" },
    { x: 2304, h: 410, z: 4, color: 0xff6a4a, intensity: 2.0, radius: 700, flicker: "pulse" },
    { x: 3000, h: 380, z: 8, color: 0xff2a1a, intensity: 2.6, radius: 760, flicker: "alarm" },
    { x: 4100, h: 380, z: 8, color: 0xff3a22, intensity: 2.2, radius: 720, flicker: "buzz" },
    { x: 2304, h: 300, z: 150, color: 0xffd0b0, intensity: 0.7, radius: 560, flicker: "broken" },
  ],
  fx: [
    { kind: "spores", x: 2304, width: 4500 },
    { kind: "embers", x: 2304, width: 4500 },
    { kind: "sparks", x: 1600, h: 380, z: 8 },
  ],
  spawn: { x: 2304, z: 70 },
};
