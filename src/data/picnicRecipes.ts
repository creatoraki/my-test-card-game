import type { ExploreAura } from "../explore/types";

export interface PicnicRecipeDef {
  id: string;
  name: string;
  ingredients: Record<string, number>;
  story: string;
  aura: ExploreAura;
}

function recipe(
  id: string,
  name: string,
  ingredients: Record<string, number>,
  auraName: string,
  auraDesc: string,
  mods: ExploreAura["mods"],
  story: string,
): PicnicRecipeDef {
  return {
    id,
    name,
    ingredients,
    story,
    aura: { id: `picnic-${id}`, name: auraName, desc: auraDesc, mods },
  };
}

export const PICNIC_RECIPES: PicnicRecipeDef[] = [
  recipe(
    "morning-meal",
    "晨间简餐",
    { milk: 1, bread: 1 },
    "暖胃",
    "战斗中提高队伍治疗与护盾效果。",
    { flat: { healBoost: 20, shieldBoost: 20 } },
    "牛奶和面包的热气在队伍之间传开，连最疲惫的人也重新坐直了身子。",
  ),
  recipe(
    "happy-combo",
    "快乐套餐",
    { cola: 1, "fried-chicken": 1 },
    "高糖冲击",
    "战斗中提高队伍暴击率与暴击伤害。",
    { flat: { critRate: 10, critDamage: 30 } },
    "可乐瓶盖弹开的声音像一声短促的号角，炸鸡让这份临时庆祝变得名副其实。",
  ),
  recipe(
    "energy-supply",
    "能量补给",
    { milk: 1, bread: 1, hamburger: 1 },
    "稳态供能",
    "战斗中提高队伍生命、防御与格挡。",
    { flat: { maxHp: 15, defense: 5, blockRate: 8 } },
    "汉堡的热量填上了队伍的空隙，接下来的长路终于不再显得遥不可及。",
  ),
  recipe(
    "party-platter",
    "聚会拼盘",
    { pizza: 1, cola: 1, "fried-chicken": 1 },
    "会前动员",
    "战斗中提高队伍先手、命中与攻击。",
    { flat: { initiative: 6, hitRate: 10, attack: 5 } },
    "披萨、可乐和炸鸡摆在一起，像一张小小的战前会议桌，所有人都开始讨论下一步。",
  ),
  recipe(
    "high-calorie-feast",
    "高热量宴席",
    { "fried-chicken": 2, hamburger: 2 },
    "油脂燃烧",
    "战斗中提高队伍攻击、穿甲与暴击伤害。",
    { flat: { attack: 12, armorPen: 6, critDamage: 25 } },
    "两份炸鸡和两只汉堡堆成一座小山，队伍用最直接的方式把热量变成了行动力。",
  ),
  recipe(
    "full-dinner",
    "全席晚餐",
    { milk: 1, bread: 1, hamburger: 1, pizza: 1 },
    "满席",
    "战斗中全面提升队伍的攻防、先手、命中与治疗。",
    { flat: { attack: 6, healPower: 6, defense: 4, initiative: 4, hitRate: 6, healBoost: 10 } },
    "所有食物都被分到每个人手里，短暂的餐桌让这趟危险远征第一次像一场真正的聚餐。",
  ),
];

/** 按多重集精确匹配：缺一种、多一种或多一份都不会命中。 */
export function matchPicnicRecipe(counts: Record<string, number>): PicnicRecipeDef | null {
  return (
    PICNIC_RECIPES.find((candidate) => {
      const ids = new Set([...Object.keys(candidate.ingredients), ...Object.keys(counts)]);
      return [...ids].every((id) => (candidate.ingredients[id] ?? 0) === (counts[id] ?? 0));
    }) ?? null
  );
}
