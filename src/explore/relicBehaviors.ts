import { makeRolledItemStack } from "../data";
import { rngFloat } from "../engine/rng";
import { changeEnergy } from "./energy";
import type { ItemStack } from "../items/types";
import type { ExploreRelicEvent } from "./relics";
import type { ExploreState } from "./types";

interface ExploreRelicBehaviorContext {
  state: ExploreState;
  stack: ItemStack;
  event: ExploreRelicEvent;
}

type ExploreRelicBehavior = (ctx: ExploreRelicBehaviorContext) => void;
type ExploreRelicBehaviorMap = Partial<Record<ExploreRelicEvent["type"], ExploreRelicBehavior>>;

export const EXPLORE_RELIC_BEHAVIORS: Record<string, ExploreRelicBehaviorMap> = {
  "relic-lucky-copper": {
    battleVictory: ({ state }) => {
      if (rngFloat(state) >= 0.2) return;
      state.pendingLoot.push(makeRolledItemStack(state, "copper-coin"));
      state.log.push("幸运铜币：额外发现铜币");
    },
  },
  "relic-compressed-biscuit": {
    nodeArrived: ({ state, event }) => {
      if (event.nodeKind !== "empty") return;
      for (const member of state.party) {
        if (member.alive) member.hp = Math.min(member.hpLimit, member.hp + 5);
      }
      state.log.push("压缩饼干：全队回复 5 点生命");
    },
  },
  "relic-dried-herb": {
    battleVictory: ({ state }) => {
      for (const member of state.party) {
        if (!member.alive) continue;
        member.hpLimit = Math.min(member.maxHp, member.hpLimit + 1);
        member.hp = Math.min(member.hpLimit, member.hp + 1);
      }
      state.log.push("干燥药草：存活角色体力极限 +1");
    },
  },
  "relic-emergency-ration": {
    roomEntered: ({ state }) => {
      const count = (state.relicCounters.ration ?? 0) + 1;
      state.relicCounters.ration = count;
      if (count % 3 !== 0) return;
      for (const member of state.party) {
        if (member.alive) member.hp = Math.min(member.hpLimit, member.hp + 3);
      }
      state.log.push("应急口粮：全队回复 3 点生命");
    },
  },
  "relic-particle-clip": {
    roomCleared: ({ state, event }) => {
      if (!event.roomId) return;
      const key = `clip:${event.roomId}`;
      if (state.relicCounters[key]) return;
      state.relicCounters[key] = 1;
      changeEnergy(state, 2);
      state.log.push("粒子回收夹：返还 2 点净化粒子");
    },
  },
};
