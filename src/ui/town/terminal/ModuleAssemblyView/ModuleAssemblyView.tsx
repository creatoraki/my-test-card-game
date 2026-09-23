// 研究中心「模组装配」页: 左角色舞台 / 中卡组网格 / 右工作台 + 模组仓架。
// ★ 页面只做编排与选择态, 装配规则在 townStore; 皮肤统一吃场景根的 researchTheme 令牌。
import { useEffect, useMemo, useState } from "react";
import { canEquipModule, getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/town/townStore";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { AssemblyBench } from "../AssemblyBench";
import { AssemblyCharacterStage } from "../AssemblyCharacterStage";
import { AssemblyDeckGrid } from "../AssemblyDeckGrid";
import { AssemblyModuleRack } from "../AssemblyModuleRack";
import s from "./ModuleAssemblyView.module.css";

interface HoveredItem {
  stack: ItemStack;
  point: TooltipPoint;
}

export function ModuleAssemblyView() {
  const storage = useTownStore((state) => state.storage);
  const characters = useTownStore((state) => state.characters);
  const awakened = useTownStore((state) => state.awakened);
  const equipCardModule = useTownStore((state) => state.equipCardModule);
  const unequipCardModule = useTownStore((state) => state.unequipCardModule);
  const [charId, setCharId] = useState(awakened[0] ?? "");
  const [cardUid, setCardUid] = useState<string | null>(null);
  const [moduleUid, setModuleUid] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);

  useEffect(() => {
    if (awakened.length && !awakened.includes(charId)) setCharId(awakened[0]);
  }, [awakened, charId]);

  const currentCharacter = characters[charId] ?? characters[awakened[0] ?? ""];
  const currentDeck = currentCharacter?.deck ?? [];
  const selectedCard = currentDeck.find((card) => card.uid === cardUid) ?? currentDeck[0];
  const moduleStacks = useMemo(
    () => storage.filter((stack) => getItemDef(stack.itemId).category === "module"),
    [storage],
  );
  const selectedModule = moduleStacks.find((stack) => stack.uid === moduleUid);
  const installedStack = selectedCard?.cardModule
    ? { uid: selectedCard.cardModule.uid, itemId: selectedCard.cardModule.itemId, count: 1 }
    : null;

  useEffect(() => {
    if (!currentDeck.some((card) => card.uid === cardUid)) setCardUid(currentDeck[0]?.uid ?? null);
  }, [cardUid, currentDeck]);

  useEffect(() => {
    if (moduleUid && !moduleStacks.some((stack) => stack.uid === moduleUid)) setModuleUid(null);
  }, [moduleStacks, moduleUid]);

  const cardCanUseSelectedModule =
    !!selectedCard && !!selectedModule && canEquipModule(selectedCard, selectedModule.itemId);

  const action = () => {
    if (!selectedCard) return;
    if (selectedCard.cardModule) unequipCardModule(charId, selectedCard.uid);
    else if (selectedModule && cardCanUseSelectedModule) {
      equipCardModule(charId, selectedCard.uid, selectedModule.uid);
    }
  };

  const showTooltip = (element: HTMLElement, stack: ItemStack) => {
    setHoveredItem({ stack, point: tooltipPointFromElement(element) });
  };

  return (
    <>
      <div className={s.body}>
        <AssemblyCharacterStage
          awakened={awakened}
          selected={charId}
          onSelect={(id) => {
            setCharId(id);
            setCardUid(characters[id]?.deck[0]?.uid ?? null);
          }}
        />
        <AssemblyDeckGrid
          deck={currentDeck}
          selectedUid={selectedCard?.uid ?? null}
          moduleStacks={moduleStacks}
          onSelect={setCardUid}
        />
        <div className={s.rightColumn}>
          <AssemblyBench
            card={selectedCard}
            installedStack={installedStack}
            candidate={selectedModule ?? null}
            actionDisabled={!selectedCard?.cardModule && !cardCanUseSelectedModule}
            onAction={action}
            onShowTooltip={showTooltip}
            onHideTooltip={() => setHoveredItem(null)}
          />
          <AssemblyModuleRack
            card={selectedCard}
            moduleStacks={moduleStacks}
            selectedModuleUid={moduleUid}
            onSelect={setModuleUid}
            onShowTooltip={showTooltip}
            onHideTooltip={() => setHoveredItem(null)}
          />
        </div>
      </div>
      {hoveredItem && <ItemTooltip stack={hoveredItem.stack} point={hoveredItem.point} />}
    </>
  );
}
