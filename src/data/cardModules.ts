import type { Card, CardDef, EffectDescriptor } from "@/engine/types";
import { getCardDef } from "./index";

export interface CardModuleDef {
  itemId: string;
  canEquip: (def: CardDef) => boolean;
  /** 装配条件的展示文案。★ 与 canEquip 写在一起, 规则改了文案不会漏改; 物品详情直接读它。 */
  equipText: string;
  /** 白名单字段覆盖: 重算时先还原成基础卡定义, 再套上当前模组的值。 */
  patch: Partial<Pick<CardDef, "cardType">>;
  /** 相对基础费用的调整。重算时独立还原, 不受卡牌强化影响。 */
  costDelta?: number;
  /** 插在 card.effects 最前的效果。 */
  prependEffects?: EffectDescriptor[];
  /** 追加到 card.effects 末尾的效果。⚠ 不能走 patch —— effects 会被 upgradeCard 就地强化,
   *  整字段还原会把强化结果一起抹掉, 所以这里改成带 fromModule 标记的追加/剥离。 */
  appendEffects?: EffectDescriptor[];
  /** 追加的卡牌词条, 同样用 fromModule 保证反复装卸幂等。 */
  appendKeywords?: CardDef["keywords"];
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
  {
    itemId: "gap-module",
    canEquip: (def) => def.cost >= 2 && def.ownerCharId !== "prophet",
    equipText: "费用 2 及以上，且不属于预言家",
    patch: {},
    costDelta: -1,
    appendEffects: [
      { type: "MARK_CARDS", amount: 1, mark: "heavy", markPick: "handHighestCostRandom" },
    ],
    textSuffix: "（落差模组：费用 -1；使用后随机令手牌中费用最高的牌获得沉重）",
  },
  {
    itemId: "satellite-module",
    canEquip: (def) => def.cost >= 3 && def.ownerCharId !== "prophet",
    equipText: "费用 3 及以上，且不属于预言家",
    patch: {},
    appendEffects: [
      {
        type: "APPLY_STATUS",
        status: "starlight",
        stacks: 1,
        target: "randomAlly",
        targetHasStatus: "starlight",
      },
    ],
    textSuffix: "（卫星模组：使用后随机为已有星辉的我方角色增加 1 层星辉）",
  },
  {
    itemId: "starloan-module",
    canEquip: (def) => def.cost >= 1 && def.ownerCharId !== "prophet",
    equipText: "费用 1 及以上，且不属于预言家",
    patch: {},
    prependEffects: [{ type: "VALUE_BOOST", boostSource: "spendPartyStarlight", boostPct: 20 }],
    textSuffix: "（借星模组：打出时全队各消耗 1 层星辉，每点星辉使本卡数值 +20%）",
  },
  {
    itemId: "aim-module",
    canEquip: (def) =>
      hasDamageEffect(def) &&
      def.ownerCharId !== "botanist" &&
      !def.keywords?.some((keyword) => keyword.id === "aim"),
    equipText: "攻击卡，且不带瞄准词条，也不属于植物学家",
    patch: {},
    prependEffects: [{ type: "VALUE_BOOST", boostSource: "primaryAimed", boostPct: 30 }],
    appendKeywords: [{ id: "aim", effects: [] }],
    textSuffix: "（瞄准模组：附加瞄准；目标已有被瞄准时本卡数值 +30%）",
  },
  {
    itemId: "ripen-module",
    canEquip: (def) => def.ownerCharId !== "botanist",
    equipText: "不属于植物学家",
    patch: {},
    appendEffects: [{ type: "CULTIVATE_TICK", amount: 1 }],
    textSuffix: "（催熟模组：使用后随机使一张带培育的手牌培育层数 -1）",
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

function hasDamageEffect(def: CardDef): boolean {
  return def.effects.some((effect) => effect.type === "DAMAGE");
}
