import type { BattleState, PendingChoice } from "../types";
import { playableHandUids } from "../cards/passiveCards";
import { partyHandLimit } from "../combat/stats";

/** 遗物选择先排队，在当前动作完成后打开，避免覆盖卡牌或组装的选择。 */
export function queueRelicChoice(state: BattleState, choice: PendingChoice): void {
  (state.relicChoices ??= []).push(choice);
}

export function openRelicChoices(state: BattleState): void {
  if (state.pendingChoice || state.phase !== "player") return;
  while (state.relicChoices?.length) {
    const choice = state.relicChoices.shift()!;
    if (choice.kind === "pickHandCard") {
      if (!playableHandUids(state).some((uid) => !state.cards[uid]?.marks?.includes("mindsEye"))) continue;
    } else if (choice.kind === "pickFromDraw") {
      choice.options = choice.options.filter((uid) => state.draw.includes(uid));
      if (!choice.options.length || state.hand.length >= partyHandLimit(state)) continue;
    }
    state.pendingChoice = choice;
    return;
  }
}
