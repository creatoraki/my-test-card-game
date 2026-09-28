import type { RoomDef } from "../../types";

/** ③ 古树穹顶: 穹顶里的巨树、苔石与浅潭。尽头房间, 一名守卫。 */
export const ARK_GROVE_ROOM: RoomDef = {
  id: "ark-grove",
  name: "古树穹顶",
  zone: "arkGrove",
  width: 4224,
  seed: 29.4,
  doors: [{ side: "left", to: "ark-garden" }],
  props: [
    { id: "ark-grove-incubator", kind: "incubator", x: 1640, z: 110, loot: "古树嫩芽" },
    { id: "ark-grove-vault", kind: "seedVault", x: 3360, z: 180, loot: "方舟种子库钥匙", flip: true },
  ],
  decor: [
    { kind: "mossRock", x: 450, z: 60, seed: 1 },
    { kind: "fern", x: 560, z: 250, seed: 2 },
    { kind: "fern", x: 1460, z: 40, seed: 3, flip: true },
    { kind: "mossRock", x: 2020, z: 252, scale: 1.2, seed: 4 },
    { kind: "fern", x: 2720, z: 40, seed: 5 },
    { kind: "fern", x: 3000, z: 262, seed: 6, flip: true },
    { kind: "mossRock", x: 3720, z: 70, seed: 7, flip: true },
    { kind: "fern", x: 3920, z: 256, seed: 8 },
  ],
  guards: [
    { id: "ark-grove-shade", patrol: [{ x: 1500, z: 210 }, { x: 2320, z: 250 }, { x: 3200, z: 150 }] },
  ],
  lights: [
    { x: 900, h: 560, z: 10, color: 0xfff4d6, intensity: 0.9, radius: 1500, flicker: "steady" },
    { x: 2320, h: 600, z: 10, color: 0xfff4d6, intensity: 0.8, radius: 1500, flicker: "steady" },
    { x: 3300, h: 560, z: 10, color: 0xfff4d6, intensity: 0.9, radius: 1500, flicker: "steady" },
    { x: 1200, h: 300, z: 6, color: 0x6cf0c0, intensity: 0.7, radius: 560, flicker: "pulse" },
    { x: 3560, h: 300, z: 6, color: 0x6cf0c0, intensity: 0.7, radius: 560, flicker: "steady" },
  ],
  fx: [
    { kind: "pollen", x: 2112, width: 4224 },
    { kind: "drip", x: 1100, h: 400 },
    { kind: "drip", x: 3040, h: 400 },
  ],
  spawn: { x: 400, z: 150 },
};
