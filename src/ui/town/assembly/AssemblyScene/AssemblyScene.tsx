import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { canEquipModule, getItemDef, recipesOfCharacter } from "@/data";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import { prefersReducedMotion } from "@/ui/app/transitions";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/cx";
import { AssemblyBench } from "../AssemblyBench";
import { AssemblyCharacterStage } from "../AssemblyCharacterStage";
import { AssemblyDeckGrid } from "../AssemblyDeckGrid";
import { AssemblyModuleRack } from "../AssemblyModuleRack";
import {
  PanelShell,
  PANEL_OUT_MS,
  PANEL_OUT_REDUCED_MS,
} from "@/ui/common/PanelShell";
import { CRAFT_ACCENT, CraftPanel } from "../CraftPanel";
import s from "./AssemblyScene.module.css";
import { AssemblyIcon, CraftIcon } from "./icons";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

/** 舱内的功能弹窗。两个弹窗共用 common/PanelShell, 只有配色与内容不同。 */
type PanelId = "assembly" | "craft";

interface Props {
  leaving?: boolean;
}

interface HoveredItem {
  stack: ItemStack;
  point: TooltipPoint;
}

export function AssemblyScene({ leaving = false }: Props) {
  const storage = useTownStore((state) => state.storage);
  const characters = useTownStore((state) => state.characters);
  const awakened = useTownStore((state) => state.awakened);
  const equipCardModule = useTownStore((state) => state.equipCardModule);
  const unequipCardModule = useTownStore((state) => state.unequipCardModule);
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [closing, setClosing] = useState(false);
  const [charId, setCharId] = useState(awakened[0] ?? "");
  const [cardUid, setCardUid] = useState<string | null>(null);
  const [moduleUid, setModuleUid] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);

  const closePanel = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!closing) return;
    const ms = prefersReducedMotion() ? PANEL_OUT_REDUCED_MS : PANEL_OUT_MS;
    const timeoutId = window.setTimeout(() => {
      setOpenPanel(null);
      setClosing(false);
      setHoveredItem(null);
    }, ms);
    return () => window.clearTimeout(timeoutId);
  }, [closing]);

  useEffect(() => {
    if (!openPanel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel, openPanel]);

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
    ? {
        uid: selectedCard.cardModule.uid,
        itemId: selectedCard.cardModule.itemId,
        count: 1,
      }
    : null;
  const installedCount = Object.values(characters).reduce(
    (count, character) => count + character.deck.filter((card) => card.cardModule).length,
    0,
  );
  // 入口副标题用的是「全体已唤醒角色能造的模组种类数」, 与弹窗里按角色分栏无关。
  const craftableCount = useMemo(
    () => new Set(awakened.flatMap((id) => recipesOfCharacter(id).map((recipe) => recipe.itemId))).size,
    [awakened],
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
    if (selectedCard.cardModule) {
      unequipCardModule(charId, selectedCard.uid);
    } else if (selectedModule && cardCanUseSelectedModule) {
      equipCardModule(charId, selectedCard.uid, selectedModule.uid);
    }
  };

  const showTooltip = (element: HTMLElement, stack: ItemStack) => {
    setHoveredItem({ stack, point: tooltipPointFromElement(element) });
  };

  return (
    <div className={cn("asm-scene", leaving && "is-leaving")}>
      <header className={cn("asm-header")} style={{ left: "56px", top: "42px" }}>
        <h2 className={cn("asm-title")}>模块装配舱</h2>
        <p className={cn("asm-sub")}>模组装配 · 拆卸 · 制造</p>
      </header>

      <div className={cn("asm-readout")} style={{ right: "56px", top: "42px" }}>
        <Readout label="库存模组" value={moduleStacks.length} />
        <Readout label="已装配" value={installedCount} />
      </div>

      <div
        className={cn("asm-entries")}
        style={
          {
            right: "0px",
            top: "138px",
            width: "460px",
            height: "188px",
            "--peek": "252px",
          } as CSSProperties
        }
      >
        <button className={cn("asm-entry")} type="button" onClick={() => setOpenPanel("assembly")}>
          <span className={cn("asm-rim")} aria-hidden />
          <span className={cn("asm-entry-icon")} aria-hidden>
            <AssemblyIcon />
          </span>
          <span className={cn("asm-entry-text")}>
            <span className={cn("asm-entry-name")}>模组装配</span>
            <span className={cn("asm-entry-desc")}>{moduleStacks.length} 件模组可用</span>
          </span>
          <span className={cn("asm-entry-go")} aria-hidden>
            ▸
          </span>
        </button>
        {/* 制造入口自带琥珀色辉光 —— 抽屉滑出时的色就是弹窗打开后的主色。 */}
        <button
          className={cn("asm-entry")}
          type="button"
          style={{ "--asm-glow": CRAFT_ACCENT } as CSSProperties}
          onClick={() => setOpenPanel("craft")}
        >
          <span className={cn("asm-rim")} aria-hidden />
          <span className={cn("asm-entry-icon")} aria-hidden>
            <CraftIcon />
          </span>
          <span className={cn("asm-entry-text")}>
            <span className={cn("asm-entry-name")}>模组制造</span>
            <span className={cn("asm-entry-desc")}>{craftableCount} 种模组可造</span>
          </span>
          <span className={cn("asm-entry-go")} aria-hidden>
            ▸
          </span>
        </button>
      </div>

      {openPanel === "assembly" && (
        <PanelShell
          accent="#52cfff"
          title="模组装配"
          status={`库存 ${moduleStacks.length} · 已装配 ${installedCount}`}
          closeLabel="关闭装配舱"
          closing={closing}
          onClose={closePanel}
        >
          <div className={cn("asm-body")}>
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
            <div className={cn("asm-right-column")}>
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
      )}

      {openPanel === "craft" && <CraftPanel closing={closing} onClose={closePanel} />}

      {hoveredItem && <ItemTooltip stack={hoveredItem.stack} point={hoveredItem.point} />}
    </div>
  );
}

function Readout({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn("asm-chip")}>
      <span className={cn("asm-chip-label")}>{label}</span>
      <strong className={cn("asm-chip-value")}>{value}</strong>
    </div>
  );
}
