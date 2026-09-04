import { getItemDef } from "@/data";
import type { GuideStep } from "@/ui/common/GuideSpotlight";
import { useGuideOnce } from "@/ui/common/GuideSpotlight";
import { useExploreStore } from "@/store/exploreStore";

const LOOT_MODULE_GUIDE: GuideStep = {
  id: "guide-loot-module",
  anchor: "loot-module",
  title: "模组可以直接装载",
  text: "悬停模组格会浮出“装载 / 拾取”按钮。装载可以当场把模组装到卡牌上，不占背包格。",
};

const LOOT_EQUIP_GUIDE: GuideStep = {
  id: "guide-loot-equip",
  anchor: "loot-equipment",
  title: "先把装备收进背包",
  text: "点击装备格即可收入背包。未拾取的装备会永久丢失。",
};

const EQUIP_WEAR_GUIDE: GuideStep = {
  id: "guide-equip-wear",
  anchor: "party",
  title: "去队伍区穿戴装备",
  text: "点击左下角队员卡打开角色档案，三个装备槽可以和背包互换，选中的装备就会穿上。",
};

const CARD_FORGE_GUIDE: GuideStep = {
  id: "guide-card-forge",
  anchor: "reward-panel",
  title: "免费锻造一张卡牌",
  text: "先选一名存活角色，再从三张候选中选一张。卡牌会直接加入他的个人卡组。",
};

function hasItemCategory(
  stacks: readonly { itemId: string }[],
  category: "module" | "equipment",
): boolean {
  return stacks.some((stack) => getItemDef(stack.itemId).category === category);
}

export function useTutorialGuides(): void {
  const session = useExploreStore((state) => state.session);
  const tutorial = session?.mapId === "tutorial";
  const pendingLoot = session?.pendingLoot ?? [];
  const pendingActions = session?.pendingActions ?? [];
  const backpack = session?.backpack ?? [];

  useGuideOnce(
    LOOT_MODULE_GUIDE,
    tutorial && hasItemCategory(pendingLoot, "module"),
  );
  useGuideOnce(
    LOOT_EQUIP_GUIDE,
    tutorial && hasItemCategory(pendingLoot, "equipment"),
  );
  useGuideOnce(
    EQUIP_WEAR_GUIDE,
    tutorial &&
      hasItemCategory(backpack, "equipment") &&
      pendingLoot.length === 0 &&
      pendingActions.length === 0,
  );
  useGuideOnce(
    CARD_FORGE_GUIDE,
    tutorial && pendingActions[0]?.kind === "forgeDraw",
  );
}
