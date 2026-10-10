import type { MapDef } from "./index";

/** 地图选择预览已接入，专属探索与战斗内容补齐后再开放。 */
export const EMBER_HEAT_WELL_MAP: MapDef = {
  id: "ember-heat-well",
  name: "余烬热井",
  desc: "熔岩井心照亮层叠的采热平台，耐热管道仍向无人城市输送能源。蒸汽与余烬之间，庞大的地热设施持续运转。",
  difficulty: 4,
  emoji: "🌋",
  maxEquipRarity: "common",
  roomCount: 12,
  battleEncounters: {
    t1: [],
    t2: [],
    t3: [],
    t4: [],
    t5: [],
  },
  locked: true,
  startingEnergy: 100,
};
