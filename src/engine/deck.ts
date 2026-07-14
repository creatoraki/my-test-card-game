// 抽牌堆 / 手牌 / 弃牌堆 / 消耗堆 的操作。共享牌库: 抽空时把弃牌洗回抽牌堆。

import type { BattleState } from "./types";
import { RULES } from "./rules";
import { shuffle } from "./rng";
import { log } from "./ops";

// 抽 n 张(受手牌上限限制)。抽牌堆空则把弃牌堆洗回。
export function drawCards(state: BattleState, n: number): void {
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    if (state.hand.length >= RULES.hand.size) break;
    if (state.draw.length === 0) {
      if (state.discard.length === 0) break; // 无牌可抽
      state.draw = shuffle(state, state.discard);
      state.discard = [];
      log(state, "🔀 弃牌堆洗回抽牌堆");
    }
    const uid = state.draw.shift()!;
    state.hand.push(uid);
    drawn++;
  }
  if (drawn > 0) log(state, `🃏 抽了 ${drawn} 张牌`);
}
