import { ops } from "../../core/ops";
import { RULES } from "../../core/battleRules";
import { activeEffectsOf } from "../../cards/cardEffects";
import type { RelicBehavior } from "../types";
import { aliveEnemyIds, randomAliveEnemy, relicData } from "../shared";

// 祝福匣限定遗物的战斗内行为(数据见 data/items/relics/blessings/blessingBox.ts)。
// 过期兴奋剂的攻击力走声明式 mods, 战后代价在 explore/relics/blessingBoxBehaviors.ts。
export const BLESSING_BOX_RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  "relic-flare": {
    onRoundStart: ({ state }) => {
      if (state.round !== 1) return;
      for (const id of aliveEnemyIds(state)) ops.applyStatus(state, id, "blind", 1, 1);
    },
  },
  // 出牌前记下主目标(运行态只存数字 ⇒ 记它在 enemyIds 里的下标), 出牌后补灼烧 ——
  // 主目标已倒下(或群攻无主目标)时改给随机存活敌人。
  "relic-disposable-lighter": {
    beforeCardEffects: (ctx, card, primaryId) => {
      const data = relicData(ctx);
      if (data.round === ctx.state.round) return;
      if (!activeEffectsOf(card).some((effect) => effect.type === "DAMAGE")) return;
      data.round = ctx.state.round;
      data.armed = 1;
      data.target = primaryId ? ctx.state.enemyIds.indexOf(primaryId) : -1;
    },
    afterCardPlay: (ctx) => {
      const data = relicData(ctx);
      if (!data.armed) return;
      data.armed = 0;
      const { state } = ctx;
      const primaryId = data.target >= 0 ? state.enemyIds[data.target] : undefined;
      const primary = primaryId ? state.combatants[primaryId] : undefined;
      const targetId = primary?.alive ? primary.id : randomAliveEnemy(state);
      if (targetId) ops.applyStatus(state, targetId, "burn", 2);
    },
  },
  "relic-instant-coffee": {
    onRoundStart: ({ state }) => {
      if (state.round === 1) ops.draw(state, 2);
    },
  },
  "relic-power-bank": {
    onRoundStart: ({ state }) => {
      if (state.round !== 1) return;
      const resource = RULES.resource.name;
      state.resources[resource] = (state.resources[resource] ?? 0) + 1;
      ops.log(state, "充电宝：行动点 +1");
    },
  },
  // 按队员记是否已触发: data[队员 id] = 1。濒死队员再挨打不扣血, 不消耗这次减半。
  "relic-bubble-wrap": {
    beforeHpLoss: (ctx, dmg) => {
      const target = ctx.state.combatants[dmg.targetId];
      if (target?.team !== "player" || target.hp <= 0) return;
      const data = relicData(ctx);
      if (data[target.id]) return;
      data[target.id] = 1;
      dmg.amount = Math.round(dmg.amount / 2);
      ops.log(ctx.state, `气泡膜：${target.name} 受到的伤害减半`);
    },
  },
};
