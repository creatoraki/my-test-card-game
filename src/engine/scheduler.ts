// ============================================================================
// 时刻调度器(本作核心特色)—— 全局时刻时钟 + 敌人行动排程。
// 出普通牌 → advanceTick(1) → 结算到点的敌人; 出速攻牌 → 不推进。
// 调度逻辑集中在此, 以后要换成"纯先攻轴"只需替换这个模块。
// ============================================================================

import type { BattleState, Enemy, FxRecorder } from "./types";
import { checkEnd, ops } from "./ops";
import { runTick } from "./statusLifecycle";
import { actAndRecord } from "./ai";

// 推进 n 个时刻。每推进 1 时刻, 结算所有 nextActTick <= tick 的存活敌人。
// fx 存在时, 每次敌人行动与其引发的弃牌触发按真实发生顺序记录。
export function advanceTick(state: BattleState, n: number, fx?: FxRecorder): void {
  for (let step = 0; step < n; step++) {
    if (state.phase !== "player") return;
    state.tick += 1;
    runTick(state);
    resolveDueEnemies(state, fx);
    checkEnd(state);
    if (state.phase !== "player") return;
  }
}

function resolveDueEnemies(state: BattleState, fx?: FxRecorder): void {
  let guard = 0;
  while (state.phase === "player") {
    const due = state.enemyIds
      .map((id) => state.combatants[id] as Enemy)
      .filter((e) => e.alive && e.nextActTick != null && e.nextActTick <= state.tick)
      .sort((a, b) => (a.nextActTick as number) - (b.nextActTick as number));
    if (due.length === 0) return;

    for (const e of due) {
      if (!e.alive || state.phase !== "player") continue;
      actAndRecord(state, e.id, fx); // 内部已重排 nextActTick
      ops.flushAutoPlays(state);
      checkEnd(state);
      if (state.phase !== "player") return;
    }
    if (++guard > 100) return; // 安全阀, 防止异常配置导致死循环
  }
}

// 回合结束时清算所有仍在蓄力的招式。使用真实时刻推进, 以保持 runTick 生命周期口径一致。
export function flushPendingActs(state: BattleState, fx?: FxRecorder): void {
  let guard = 0;
  while (state.phase === "player") {
    const hasPending = state.enemyIds.some((id) => {
      const enemy = state.combatants[id] as Enemy;
      return enemy.alive && enemy.nextActTick != null;
    });
    if (!hasPending) return;

    advanceTick(state, 1, fx);
    if (++guard > 999) return;
  }
}
