import type { RoomDef } from "../../types";

/** ① 方舟观景台: 通高玻璃幕墙外是天空城市与巨树穹顶。起点房间, 没有守卫。 */
export const ARK_DECK_ROOM: RoomDef = {
  id: "ark-deck",
  name: "方舟观景台",
  zone: "arkDeck",
  width: 4224,
  seed: 5.7,
  doors: [{ side: "right", to: "ark-garden" }],
  props: [
    { id: "ark-deck-terminal", kind: "terminal", x: 1260, z: 70, loot: "营养液 ×3" },
    { id: "ark-deck-vault", kind: "seedVault", x: 2920, z: 150, loot: "稀有种子 ×2", flip: true },
  ],
  decor: [
    { kind: "planter", x: 540, z: 40, seed: 1 },
    { kind: "palmPot", x: 900, z: 46, seed: 2 },
    { kind: "fern", x: 1560, z: 262, seed: 3 },
    { kind: "bench", x: 1880, z: 62, seed: 4 },
    { kind: "planter", x: 2380, z: 40, scale: 1.1, seed: 5, flip: true },
    { kind: "fern", x: 3180, z: 268, seed: 6, flip: true },
    { kind: "palmPot", x: 3400, z: 44, scale: 1.1, seed: 7, flip: true },
    { kind: "bench", x: 3760, z: 64, seed: 8, flip: true },
  ],
  guards: [],
  lights: [
    { x: 700, h: 560, z: 10, color: 0xfff1d8, intensity: 1.0, radius: 1500, flicker: "steady" },
    { x: 2100, h: 560, z: 10, color: 0xfff1d8, intensity: 1.0, radius: 1500, flicker: "steady" },
    { x: 3500, h: 560, z: 10, color: 0xfff1d8, intensity: 1.0, radius: 1500, flicker: "steady" },
    { x: 1420, h: 372, z: 8, color: 0x5cf2ff, intensity: 0.8, radius: 600, flicker: "pulse" },
    { x: 2780, h: 372, z: 8, color: 0x5cf2ff, intensity: 0.8, radius: 600, flicker: "steady" },
  ],
  fx: [{ kind: "pollen", x: 2112, width: 4224 }],
  spawn: { x: 420, z: 170 },
};
