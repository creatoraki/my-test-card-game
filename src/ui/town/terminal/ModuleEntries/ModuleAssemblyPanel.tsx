import { useEffect, useMemo, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { canEquipModule, getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { PanelShell } from "@/ui/common/PanelShell";
import type { Rect } from "@/ui/common/panelMorph";
import { AssemblyBench } from "../AssemblyBench";
import { AssemblyCharacterStage } from "../AssemblyCharacterStage";
import { AssemblyDeckGrid } from "../AssemblyDeckGrid";
import { AssemblyModuleRack } from "../AssemblyModuleRack";
import s from "./ModuleAssemblyPanel.module.css";

export interface ModulePanelMorph {
  ref: Ref<HTMLElement>;
  rect: Rect;
  ready: boolean;
  seed?: ReactNode;
  seedLabel?: string;
}

interface Props {
  closing: boolean;
  onClose: () => void;
  morph: ModulePanelMorph;
}

interface HoveredItem {
  stack: ItemStack;
  point: TooltipPoint;
}

const ASSEMBLY_THEME = {
  "--asm-panel-bg": "#0b1116f2",
  "--asm-panel-filter": "blur(10px) saturate(104%) brightness(0.82)",
  "--panel-shell-title-size": "34px",
  "--panel-shell-status-size": "20px",
  "--panel-shell-close-size": "36px",
} as CSSProperties;

export function ModuleAssemblyPanel({ closing, onClose, morph }: Props) {
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
  const installedCount = Object.values(characters).reduce(
    (count, character) => count + character.deck.filter((card) => card.cardModule).length,
    0,
  );

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
      <PanelShell
        accent="#52cfff"
        title="模组装配"
        status={`库存 ${moduleStacks.length} · 已装配 ${installedCount}`}
        closeLabel="关闭模组装配"
        closing={closing}
        onClose={onClose}
        themeStyle={ASSEMBLY_THEME}
        morph={morph}
      >
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
      </PanelShell>
      {hoveredItem && <ItemTooltip stack={hoveredItem.stack} point={hoveredItem.point} />}
    </>
  );
}
