import type { RoomDef } from "../../types";

/** ② 空中花园廊桥: 敞开的白色廊架与拱形花架, 远处飞瀑与穹顶。一名守卫。 */
export const ARK_GARDEN_ROOM: RoomDef = {
  id: "ark-garden",
  name: "空中花园廊桥",
  zone: "arkGarden",
  width: 4992,
  seed: 17.2,
  doors: [
    { side: "left", to: "ark-deck" },
    { side: "right", to: "ark-grove" },
  ],
  props: [
    { id: "ark-garden-incubator", kind: "incubator", x: 1360, z: 90, loot: "萌芽样本" },
    { id: "ark-garden-terminal", kind: "terminal", x: 3900, z: 190, loot: "净水滤芯 ×2", flip: true },
  ],
  decor: [
    { kind: "planter", x: 700, z: 40, seed: 1 },
    { kind: "fern", x: 980, z: 232, seed: 2 },
    { kind: "mossRock", x: 1760, z: 226, seed: 3 },
    { kind: "bench", x: 2500, z: 58, seed: 4 },
    { kind: "palmPot", x: 2880, z: 42, seed: 5 },
    { kind: "fern", x: 3320, z: 234, seed: 6, flip: true },
    { kind: "planter", x: 4420, z: 42, seed: 7, flip: true },
    { kind: "mossRock", x: 4660, z: 228, scale: 0.9, seed: 8 },
  ],
  guards: [
    { id: "ark-garden-shade", patrol: [{ x: 2040, z: 120 }, { x: 3040, z: 200 }, { x: 3560, z: 110 }] },
  ],
  lights: [
    { x: 800, h: 560, z: 10, color: 0xfff1d8, intensity: 1.0, radius: 1600, flicker: "steady" },
    { x: 2300, h: 560, z: 10, color: 0xfff1d8, intensity: 1.0, radius: 1600, flicker: "steady" },
    { x: 3800, h: 560, z: 10, color: 0xfff1d8, intensity: 1.0, radius: 1600, flicker: "steady" },
    { x: 1600, h: 404, z: 6, color: 0x5cf2d0, intensity: 0.8, radius: 560, flicker: "pulse" },
    { x: 3240, h: 404, z: 6, color: 0x5cf2d0, intensity: 0.8, radius: 560, flicker: "steady" },
  ],
  fx: [
    { kind: "pollen", x: 2496, width: 4992 },
    { kind: "drip", x: 1920, h: 380 },
    { kind: "drip", x: 4180, h: 380 },
  ],
  spawn: { x: 400, z: 150 },
};
