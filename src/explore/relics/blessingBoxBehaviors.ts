import { changeEnergy } from "../resources/energy";
import type { ExploreRelicBehaviorMap } from "./relicBehaviors";

// 祝福匣限定遗物的探索侧行为(数据见 data/items/relics/blessings/blessingBox.ts)。
// 过期兴奋剂是战斗生效的遗物, 攻击力加成走声明式 mods, 战后扣血的代价在这里结算。
export const BLESSING_BOX_EXPLORE_BEHAVIORS: Record<string, ExploreRelicBehaviorMap> = {
  "relic-expired-stimulant": {
    battleVictory: ({ state }) => {
      // 战后代价不致死: 最低留 1 点生命。
      for (const member of state.party) {
        if (member.alive) member.hp = Math.max(1, member.hp - 3);
      }
      state.log.push("过期兴奋剂：全队失去 3 点生命");
    },
  },
  "relic-temp-badge": {
    roomEntered: ({ state }) => {
      changeEnergy(state, 2);
      state.log.push("临时工牌：获得 2 点净化粒子");
    },
  },
};
