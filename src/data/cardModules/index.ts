// 卡牌模组注册表 —— 角色关键词模组(制造产出) + 通用模组(战斗掉落)汇总。
// 装配/拆卸的幂等重算逻辑集中在 recomputeCardModule, 两类模组共用同一套框架。

import type { Card } from "@/engine/types";
import { getCardDef } from "../index";
import { CHARACTER_CARD_MODULES } from "./character";
import { GENERIC_T1_CARD_MODULES } from "./genericT1";
import type { CardModuleDef } from "./types";

export type { CardModuleDef } from "./types";
export { hasDamageEffect, hasScaledDamage, hasScaledSupport } from "./types";
export { GENERIC_T1_MODULE_IDS } from "./genericT1";

export const CARD_MODULES: CardModuleDef[] = [
  ...CHARACTER_CARD_MODULES,
  ...GENERIC_T1_CARD_MODULES,
];

export function getCardModule(itemId: string): CardModuleDef | undefined {
  return CARD_MODULES.find((module) => module.itemId === itemId);
}

export function canEquipModule(card: Card, itemId: string): boolean {
  const module = getCardModule(itemId);
  if (!module) return false;
  return module.canEquip(getCardDef(card.id));
}

export function recomputeCardModule(card: Card): void {
  const base = getCardDef(card.id);
  const module = card.cardModule ? getCardModule(card.cardModule.itemId) : undefined;
  const patchKeys = new Set<keyof CardModuleDef["patch"]>();
  for (const definition of CARD_MODULES) {
    for (const key of Object.keys(definition.patch) as Array<keyof CardModuleDef["patch"]>) {
      patchKeys.add(key);
    }
  }

  for (const key of patchKeys) {
    Object.assign(card, { [key]: base[key] });
  }
  for (const [key, value] of Object.entries(module?.patch ?? {})) {
    if (value !== undefined) Object.assign(card, { [key]: value });
  }
  card.cost = base.cost + (module?.costDelta ?? 0);

  // 先剥离历史模组效果, 再叠加当前模组的 —— 保证反复装/拆是幂等的。
  card.effects = card.effects.filter((effect) => !effect.fromModule);
  card.effects.unshift(
    ...(module?.prependEffects ?? []).map((effect) => ({ ...effect, fromModule: module!.itemId })),
  );
  for (const effect of module?.appendEffects ?? []) {
    card.effects.push({ ...effect, fromModule: module!.itemId });
  }

  const keywords = (card.keywords ?? []).filter((keyword) => !keyword.fromModule);
  for (const keyword of module?.appendKeywords ?? [])
    keywords.push({ ...keyword, fromModule: module!.itemId });
  card.keywords = keywords;

  // 文案同理: 剔除**所有**登记过的后缀, 再拼当前模组的, 卡牌自身文案与「（已强化）」原样保留。
  for (const definition of CARD_MODULES) {
    if (definition.textSuffix) card.text = card.text.split(definition.textSuffix).join("");
  }
  if (module?.textSuffix) card.text += module.textSuffix;
}
