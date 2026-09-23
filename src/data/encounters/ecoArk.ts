import type { EncounterDef, EnemyPlacement } from "./index";

const ENEMY_IDS = {
  crab: "ark-moss-crab", moth: "ark-spore-moth", mantis: "ark-thorn-mantis",
  snail: "ark-irrigation-snail", seed: "ark-seed-sentry", stag: "ark-canopy-stag",
  keeper: "ark-nursery-keeper", mother: "ark-mother-core",
  gear: "treasure-mimic-gear", card: "treasure-mimic-card",
} as const;
type ArkSlot = keyof typeof ENEMY_IDS;
const SCALE: Record<ArkSlot, number> = {
  crab: 0.95, moth: 0.95, mantis: 1.15, snail: 0.9, seed: 0.9,
  stag: 1.25, keeper: 1.25, mother: 1.8, gear: 1.1, card: 1.1,
};

function row(...kinds: ArkSlot[]): EnemyPlacement[] {
  const spacing = kinds.length > 3 ? 365 : 410;
  return kinds.map((kind, index) => ({
    id: ENEMY_IDS[kind],
    // UI 的槽位间隔为 276px；位移将单位展开到场景横轴。
    dx: (index - (kinds.length - 1) / 2) * (spacing - 276),
    dy: kind === "moth" ? 90 : 220,
    lift: kind === "moth" ? 130 : 0,
    scale: SCALE[kind],
    flip: kinds.length > 1 && index === kinds.length - 1,
  }));
}

export const ARK_ENCOUNTERS: EncounterDef[] = [
  { id: "a-t1-cargo", name: "苔甲运送队", enemies: row("crab", "seed") },
  { id: "a-t1-seeds", name: "播种巡逻", enemies: row("mantis", "seed") },
  { id: "a-t1-water", name: "水道浮光", enemies: row("snail", "moth") },
  { id: "a-t2-pruning", name: "修枝班组", enemies: row("mantis", "crab", "seed") },
  { id: "a-t2-pollen", name: "授粉航线", enemies: row("moth", "snail", "seed") },
  { id: "a-t2-pods", name: "种荚交火", enemies: row("seed", "mantis", "seed") },
  { id: "a-t2-shell", name: "水膜货运", enemies: row("crab", "snail") },
  { id: "a-t3-canopy", name: "冠层剪影", enemies: row("moth", "mantis", "crab") },
  { id: "a-t3-irrigation", name: "灌溉封锁", enemies: row("snail", "crab", "seed") },
  { id: "a-t3-nursery", name: "育苗警戒", enemies: row("mantis", "snail", "moth") },
  { id: "a-t4-stag", name: "巡猎警报", enemies: row("stag", "moth", "seed") },
  { id: "a-t4-keeper", name: "温室禁入", enemies: row("mantis", "keeper", "seed") },
  { id: "a-t4-symbiosis", name: "共生巡守", enemies: row("stag", "keeper") },
  { id: "a-t4-overgrowth", name: "过度繁茂", enemies: row("seed", "crab", "mantis", "moth") },
  { id: "a-t5-mother", name: "最后的保育指令", enemies: row("mother") },
  { id: "a-mimic-gear", name: "根系藏械", enemies: row("seed", "gear", "crab") },
  { id: "a-mimic-card", name: "叶间牌匣", enemies: row("mantis", "card", "seed") },
];
