import type { Card, CardDef, EffectDescriptor } from "@/engine/types";
import { getCardDef } from "./index";

export interface CardModuleDef {
  itemId: string;
  canEquip: (def: CardDef) => boolean;
  /** 装配条件的展示文案。★ 与 canEquip 写在一起, 规则改了文案不会漏改; 物品详情直接读它。 */
  equipText: string;
  /** 白名单字段覆盖: 重算时先还原成基础卡定义, 再套上当前模组的值。 */
  patch: Partial<Pick<CardDef, "cardType">>;
  /** 追加到 card.effects 末尾的效果。⚠ 不能走 patch —— effects 会被 upgradeCard 就地强化,
   *  整字段还原会把强化结果一起抹掉, 所以这里改成带 fromModule 标记的追加/剥离。 */
  appendEffects?: EffectDescriptor[];
  /** 追加到 card.text 末尾的说明。重算时按登记过的全部后缀做剔除, 同样不碰卡牌自身文案。 */
  textSuffix?: string;
}

export const CARD_MODULES: CardModuleDef[] = [
  {
    itemId: "rush-module",
    // 剑士是这两个模组的制造者, 自己的卡不能装 —— 见《模组制造》需求。
    canEquip: (def) => def.cardType === "normal" && def.ownerCharId !== "swordsman",
    equipText: "普通牌，且不属于剑士",
    patch: { cardType: "fast" },
  },
  {
    itemId: "discard-module",
    canEquip: (def) => def.cost >= 2 && def.ownerCharId !== "swordsman",
    equipText: "费用 2 及以上，且不属于剑士",
    patch: {},
    appendEffects: [{ type: "DISCARD", amount: 1, discardPick: "handBottom" }],
    textSuffix: "（弃牌模组：使用后弃置手牌最后一张）",
  },
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

  // 先剥离历史模组效果, 再叠加当前模组的 —— 保证反复装/拆是幂等的。
  card.effects = card.effects.filter((effect) => !effect.fromModule);
  for (const effect of module?.appendEffects ?? []) {
    card.effects.push({ ...effect, fromModule: module!.itemId });
  }

  // 文案同理: 剔除**所有**登记过的后缀, 再拼当前模组的, 卡牌自身文案与「（已强化）」原样保留。
  for (const definition of CARD_MODULES) {
    if (definition.textSuffix) card.text = card.text.split(definition.textSuffix).join("");
  }
  if (module?.textSuffix) card.text += module.textSuffix;
}
