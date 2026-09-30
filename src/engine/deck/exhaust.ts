import type { BattleState } from "../types";
import { runRelicHook } from "../relics/types";

/**
 * 把一张卡放进消耗堆(去重)并触发「卡牌被消耗」遗物钩子。
 * ★ 所有进入消耗堆的写入都走这里; 调用方自己负责把卡从原位置(手牌等)移走。
 */
export function exhaustCard(state: BattleState, uid: string): void {
  if (state.exhaust.includes(uid)) return;
  state.exhaust.push(uid);
  runRelicHook(state, "onCardExhausted", uid);
}
