import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { canEquipModule, getCharacter, getItemDef } from "@/data";
import type { Card } from "@/engine";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTooltip, {
  tooltipPointFromRect,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { DeckCard } from "@/ui/character/DeckCard";
import { cx } from "@/ui/common/cx";
import s from "./AssemblyScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

const PANEL_OUT_MS = 600;
const PANEL_OUT_REDUCED_MS = 180;
const CONTENT_DELAY_MS = 560;
const PANEL_SIZE = { w: 1480, h: 760 };

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
  const reason = selectedCard?.cardModule
    ? ""
    : !selectedCard
      ? "先选择一张卡牌"
      : !moduleStacks.length
        ? "仓库中没有可用模组"
        : !selectedModule
          ? "先选择一个仓库模组"
          : !cardCanUseSelectedModule
            ? "只有定义类型为普通的卡牌可以装配"
            : "";

  const action = () => {
    if (!selectedCard) return;
    if (selectedCard.cardModule) {
      unequipCardModule(charId, selectedCard.uid);
    } else if (selectedModule && cardCanUseSelectedModule) {
      equipCardModule(charId, selectedCard.uid, selectedModule.uid);
    }
  };

  const showTooltip = (event: ReactPointerEvent<HTMLDivElement>, stack: ItemStack) => {
    setHoveredItem({ stack, point: tooltipPointFromRect(event.currentTarget.getBoundingClientRect()) });
  };

  return (
    <div className={cn("asm-scene", leaving && "is-leaving")}>
      <header className={cn("asm-header")} style={{ left: "56px", top: "42px" }}>
        <span className={cn("asm-kicker")}>MODULE BAY</span>
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
            onClick={(event) => event.stopPropagation()}
            style={{
              width: `${PANEL_SIZE.w}px`,
              height: `${PANEL_SIZE.h}px`,
              "--content-delay": `${CONTENT_DELAY_MS}ms`,
            } as CSSProperties}
          >
            <PanelHead onClose={closePanel} />
            <div className={cn("asm-body")}>
              <CharacterRail
                awakened={awakened}
                characters={characters}
                selected={charId}
                onSelect={(id) => {
                  setCharId(id);
                  setCardUid(characters[id]?.deck[0]?.uid ?? null);
                }}
              />
              <DeckPanel
                deck={currentDeck}
                selectedUid={selectedCard?.uid ?? null}
                moduleStacks={moduleStacks}
                onSelect={setCardUid}
              />
              <ModulePanel
                card={selectedCard}
                installedStack={installedStack}
                moduleStacks={moduleStacks}
                selectedModuleUid={moduleUid}
                onSelectModule={setModuleUid}
                onAction={action}
                actionDisabled={!selectedCard?.cardModule && !cardCanUseSelectedModule}
                reason={reason}
                onShowTooltip={showTooltip}
                onHideTooltip={() => setHoveredItem(null)}
              />
            </div>
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

function PanelHead({ onClose }: { onClose: () => void }) {
  return (
    <div className={cn("asm-panel-head")}>
      <div>
        <span className={cn("asm-kicker")}>ASSEMBLY</span>
        <h3 className={cn("asm-panel-title")}>卡牌模组装配</h3>
      </div>
      <button className={cn("asm-close")} type="button" onClick={onClose} aria-label="关闭">
        ✕
      </button>
    </div>
  );
}

function CharacterRail({
  awakened,
  characters,
  selected,
  onSelect,
}: {
  awakened: string[];
  characters: Record<string, { charId: string }>;
  selected: string;
  onSelect: (charId: string) => void;
}) {
  return (
    <aside className={cn("asm-characters")}>
      <span className={cn("asm-section-label")}>PERSONNEL</span>
      <div className={cn("asm-character-list")}>
        {awakened.map((id) => {
          const character = getCharacter(id);
          return (
            <button
              key={id}
              className={cn("asm-character", id === selected && "is-selected")}
              type="button"
              onClick={() => onSelect(id)}
              style={{ "--character-color": character.color } as CSSProperties}
            >
              <CharacterPortrait
                characterId={id}
                emoji={character.emoji}
                alt={character.name}
                className={cn("asm-portrait")}
              />
              <span className={cn("asm-character-name")}>{character.name}</span>
              <span className={cn("asm-character-count")}>{characters[id]?.charId === id ? "ONLINE" : ""}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function DeckPanel({
  deck,
  selectedUid,
  moduleStacks,
  onSelect,
}: {
  deck: Card[];
  selectedUid: string | null;
  moduleStacks: ItemStack[];
  onSelect: (uid: string) => void;
}) {
  return (
    <section className={cn("asm-deck")}>
      <div className={cn("asm-column-head")}>
        <span className={cn("asm-section-label")}>CARD ARRAY</span>
        <span className={cn("asm-column-note")}>{deck.length} 张卡牌</span>
      </div>
      <div className={cn("asm-card-grid")}>
        {deck.map((card, index) => {
          const usable = !!card.cardModule || moduleStacks.some((stack) => canEquipModule(card, stack.itemId));
          return (
            <div key={card.uid} className={cn("asm-card-wrap", !usable && "is-dimmed")}>
              <DeckCard
                card={card}
                selected={card.uid === selectedUid}
                index={index}
                onClick={() => onSelect(card.uid)}
              />
              {card.cardModule && <span className={cn("asm-installed-badge")}>已装配</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ModulePanel({
  card,
  installedStack,
  moduleStacks,
  selectedModuleUid,
  onSelectModule,
  onAction,
  actionDisabled,
  reason,
  onShowTooltip,
  onHideTooltip,
}: {
  card?: Card;
  installedStack: ItemStack | null;
  moduleStacks: ItemStack[];
  selectedModuleUid: string | null;
  onSelectModule: (uid: string) => void;
  onAction: () => void;
  actionDisabled: boolean;
  reason: string;
  onShowTooltip: (event: ReactPointerEvent<HTMLDivElement>, stack: ItemStack) => void;
  onHideTooltip: () => void;
}) {
  const detailStack = installedStack ?? moduleStacks.find((stack) => stack.uid === selectedModuleUid) ?? null;
  return (
    <aside className={cn("asm-module-panel")}>
      <div className={cn("asm-slot-head")}>
        <span className={cn("asm-section-label")}>MODULE SLOT</span>
        <span className={cn("asm-column-note")}>{card ? card.name : "未选择卡牌"}</span>
      </div>
      <div
        className={cn("asm-installed-slot")}
        onPointerEnter={(event) => installedStack && onShowTooltip(event, installedStack)}
        onPointerLeave={onHideTooltip}
      >
        {installedStack ? <ItemSlot stack={installedStack} showName={false} /> : <span className={cn("asm-empty-slot")}>EMPTY</span>}
      </div>
      <div className={cn("asm-module-stock-head")}>
        <span className={cn("asm-section-label")}>WAREHOUSE MODULES</span>
        <span className={cn("asm-column-note")}>{moduleStacks.length} 件</span>
      </div>
      <div className={cn("asm-module-grid")}>
        {moduleStacks.map((stack) => (
          <div
            key={stack.uid}
            className={cn("asm-module-option", stack.uid === selectedModuleUid && "is-selected")}
            onPointerEnter={(event) => onShowTooltip(event, stack)}
            onPointerLeave={onHideTooltip}
          >
            <ItemSlot
              stack={stack}
              showName={false}
              selected={stack.uid === selectedModuleUid}
              onClick={() => onSelectModule(stack.uid)}
            />
          </div>
        ))}
      </div>
      <ItemDetail stack={detailStack} placeholder="选择仓库模组查看详情。" className={cn("asm-detail")} />
      <div className={cn("asm-action-row")}>
        <button
          className={cn("asm-action", card?.cardModule && "is-remove")}
          type="button"
          disabled={actionDisabled}
          onClick={onAction}
        >
          {card?.cardModule ? "拆卸" : "装配"}
        </button>
        <span className={cn("asm-reason")}>{reason || "模组将直接写入卡牌实例。"}</span>
      </div>
    </aside>
  );
}

function AssemblyIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M24 6 39.6 15v18L24 42 8.4 33V15L24 6Z" strokeWidth={1.2} opacity={0.38} />
      <path d="M24 13 33 18.5v11L24 35l-9-5.5v-11L24 13Z" strokeWidth={1.6} />
      <circle cx="24" cy="24" r="3" strokeWidth={1.6} />
    </svg>
  );
}
