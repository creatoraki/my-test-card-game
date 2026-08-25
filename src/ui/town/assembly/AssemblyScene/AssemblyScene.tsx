import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { canEquipModule, getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { EventPanelFrame } from "@/ui/common/EventPanel";
import ItemTooltip, {
  tooltipPointFromRect,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/cx";
import { AssemblyBench } from "../AssemblyBench";
import { AssemblyCharacterStage } from "../AssemblyCharacterStage";
import { AssemblyDeckGrid } from "../AssemblyDeckGrid";
import { AssemblyModuleRack } from "../AssemblyModuleRack";
import s from "./AssemblyScene.module.css";
import { AssemblyIcon, CloseIcon } from "./icons";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

const PANEL_OUT_MS = 600;
const PANEL_OUT_REDUCED_MS = 180;
const PANEL_SIZE = { w: 1600, h: 920 };

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
  const [panelOpen, setPanelOpen] = useState(false);
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
      setPanelOpen(false);
      setClosing(false);
      setHoveredItem(null);
    }, ms);
    return () => window.clearTimeout(timeoutId);
  }, [closing]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel, panelOpen]);

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
    setHoveredItem({ stack, point: tooltipPointFromRect(element.getBoundingClientRect()) });
  };

  return (
    <div className={cn("asm-scene", leaving && "is-leaving")}>
      <header className={cn("asm-header")} style={{ left: "56px", top: "42px" }}>
        <span className={cn("asm-kicker")}>模块装配舱</span>
        <h2 className={cn("asm-title")}>模块装配舱</h2>
        <p className={cn("asm-sub")}>卡牌模组装配 · 拆卸</p>
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
            height: "88px",
            "--peek": "252px",
          } as CSSProperties
        }
      >
        <button className={cn("asm-entry")} type="button" onClick={() => setPanelOpen(true)}>
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
      </div>

      {panelOpen && (
        <div
          className={cn("asm-modal", closing && "is-closing")}
          onClick={closePanel}
          style={
            {
              "--panel-w": `${PANEL_SIZE.w}px`,
              "--panel-h": `${PANEL_SIZE.h}px`,
            } as CSSProperties
          }
        >
          <section
            className={cn("asm-panel")}
            data-closing={closing}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: `${PANEL_SIZE.w}px`,
              height: `${PANEL_SIZE.h}px`,
            } as CSSProperties}
          >
            <EventPanelFrame
              accent="#52cfff"
              kicker="装配模块"
              title="卡牌模组装配"
              status={<span className={cn("asm-panel-status")}>库存 {moduleStacks.length} · 已装配 {installedCount}</span>}
              headerExtra={
                <button className={cn("asm-close-button")} type="button" onClick={closePanel} aria-label="关闭装配舱">
                  <CloseIcon />
                </button>
              }
              className={cn("asm-event-frame")}
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
            </EventPanelFrame>
          </section>
        </div>
      )}
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
