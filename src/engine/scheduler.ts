// ============================================================================
// 时刻调度器(本作核心特色)—— 全局时刻时钟 + 敌人行动排程。
// 出普通牌 → advanceTick(1) → 结算到点的敌人; 出速攻牌 → 不推进。
// 调度逻辑集中在此, 以后要换成"纯先攻轴"只需替换这个模块。
// ============================================================================

import type { AnimFrame, BattleState, Enemy } from "./types";
import { checkEnd, runTick } from "./ops";
import { actAndRecord } from "./ai";

// 推进 n 个时刻。每推进 1 时刻, 结算所有 nextActTick <= tick 的存活敌人。
// frames 存在时, 每次敌人行动会记录一帧动画(供 UI 逐帧回放)。
export function advanceTick(state: BattleState, n: number, frames?: AnimFrame[]): void {
  for (let step = 0; step < n; step++) {
    if (state.phase !== "player") return;
    state.tick += 1;
    runTick(state);
    resolveDueEnemies(state, frames);
    checkEnd(state);
    if (state.phase !== "player") return;
  }
}

function resolveDueEnemies(state: BattleState, frames?: AnimFrame[]): void {
  let guard = 0;
  while (state.phase === "player") {
    const due = state.enemyIds
      .map((id) => state.combatants[id] as Enemy)
      .filter((e) => e.alive && e.nextActTick <= state.tick)
      .sort((a, b) => a.nextActTick - b.nextActTick);
    if (due.length === 0) return;

    for (const e of due) {
      if (!e.alive || state.phase !== "player") continue;
      actAndRecord(state, e.id, frames); // 内部已重排 nextActTick
      checkEnd(state);
      if (state.phase !== "player") return;
    }
    if (++guard > 100) return; // 安全阀, 防止 castTick 配置异常导致死循环
  }
}
