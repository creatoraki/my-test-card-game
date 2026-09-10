
export interface PicnicRecipeDef {
  id: string;
  name: string;
  ingredients: Record<string, number>;
  story: string;
  relicId: string;
}

function recipe(
  id: string,
  name: string,
  ingredients: Record<string, number>,
  relicId: string,
  story: string,
): PicnicRecipeDef {
  return {
    id,
    name,
    ingredients,
    story,
    relicId,
  };
}

export const PICNIC_RECIPES: PicnicRecipeDef[] = [
  recipe(
    "morning-meal",
    "晨间简餐",
    { milk: 1, bread: 1 },
    "picnic-morning-meal",
    "牛奶和面包的热气在队伍之间传开，连最疲惫的人也重新坐直了身子。",
  ),
  recipe(
    "happy-combo",
    "快乐套餐",
    { cola: 1, "fried-chicken": 1 },
    "picnic-happy-combo",
    "可乐瓶盖弹开的声音像一声短促的号角，炸鸡让这份临时庆祝变得名副其实。",
  ),
  recipe(
    "energy-supply",
    "能量补给",
    { milk: 1, bread: 1, hamburger: 1 },
    "picnic-energy-supply",
    "汉堡的热量填上了队伍的空隙，接下来的长路终于不再显得遥不可及。",
  ),
  recipe(
    "party-platter",
    "聚会拼盘",
    { pizza: 1, cola: 1, "fried-chicken": 1 },
    "picnic-party-platter",
    "披萨、可乐和炸鸡摆在一起，像一张小小的战前会议桌，所有人都开始讨论下一步。",
  ),
  recipe(
    "high-calorie-feast",
    "高热量宴席",
    { "fried-chicken": 2, hamburger: 2 },
    "picnic-high-calorie-feast",
    "两份炸鸡和两只汉堡堆成一座小山，队伍用最直接的方式把热量变成了行动力。",
  ),
  recipe(
    "full-dinner",
    "全席晚餐",
    { milk: 1, bread: 1, hamburger: 1, pizza: 1 },
    "picnic-full-dinner",
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
