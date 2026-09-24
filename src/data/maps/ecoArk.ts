import type { MapDef } from "./index";

/** 同样是十二间房，通过敌人协作与轻度数值提升形成半档进阶。 */
export const ECO_ARK_MAP: MapDef = {
  id: "eco-ark",
  name: "生态方舟",
  desc: "穹顶下的生态维护系统把闯入者标记成了入侵物种。穿过失控的培育舱与孢子林，关闭仍在执行保育指令的母树中枢。普通难度介于普通与困难废弃楼层之间。",
  difficulty: 3.5,
  emoji: "🌳",
  maxEquipRarity: "common",
  roomCount: 12,
  nearMapVariants: ["ecoArk1", "ecoArk2", "ecoArk3", "ecoArk4"],
  curioLevelRange: [1, 3],
  battleEncounters: {
    t1: ["a-t1-cargo", "a-t1-seeds", "a-t1-water"],
    t2: ["a-t2-pruning", "a-t2-pollen", "a-t2-pods", "a-t2-shell"],
    t3: ["a-t3-canopy", "a-t3-irrigation", "a-t3-nursery"],
    t4: ["a-t4-stag", "a-t4-keeper", "a-t4-symbiosis", "a-t4-overgrowth"],
    t5: ["a-t5-mother"],
  },
  treasureEncounters: ["a-mimic-gear", "a-mimic-card"],
  curioPool: {
    // 未覆写的通用物件保持原权重；新物件只在方舟投放。
    weights: { arkSeedVault: 16, arkComposter: 12, arkGeneConsole: 6 },
    healKinds: ["arkDewCollector", "arkDewCollector", "medical", "energyStation"],
    trapKinds: ["arkSporeVent", "arkSporeVent", "leakingPipe"],
  },
  requiresClear: "neon-city",
  startingEnergy: 100,
};
