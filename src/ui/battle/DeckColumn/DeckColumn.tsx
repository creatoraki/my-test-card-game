import type { BattleState, Card } from "@/engine";
import { RULES, canPlay, partyHandLimit } from "@/engine";
import { useHandHover } from "@/ui/battle/handFocusStore";
import { ManaCrystalIcon } from "@/ui/common/ManaCrystalIcon";
import { PileButton } from "@/ui/battle/PileButton";
import s from "./DeckColumn.module.css";

export type HandAction = "redraw" | "discard" | null;
export type Pile = "draw" | "discard" | "exhaust";

interface Props {
  battle: BattleState;
  selectedCard: Card | null;
  handAction: HandAction;
  isPlayerTurn: boolean;
  animating: boolean;
  onToggleHandAction: (action: Exclude<HandAction, null>) => void;
  onOpenPile: (pile: Pile) => void;
}

export function DeckColumn({
  battle,
  selectedCard,
  handAction,
  isPlayerTurn,
  animating,
  onToggleHandAction,
  onOpenPile,
}: Props) {
  const hoveredCard = useHandHover();
  const focusedCard = hoveredCard ?? selectedCard;
  const mana = battle.resources[RULES.resource.name] ?? 0;
  const maxMana = RULES.resource.perRound;
  const handLimit = partyHandLimit(battle);
  const canUseHandActions = isPlayerTurn && !animating && battle.hand.length > 0;
  const redrawAvailable = canUseHandActions && battle.redrawsThisRound < 1;
  const preview = focusedCard && handAction === null ? mana - focusedCard.cost : null;
  const previewCard = focusedCard && handAction === null ? focusedCard : null;

  return (
    <section className={s.column} aria-label="手牌与牌堆操作" onClick={(event) => event.stopPropagation()}>
      <div className={s.handReadout}>
        <span>HAND</span>
        <b>{String(battle.hand.length).padStart(2, "0")}</b>
        <i>/{String(handLimit).padStart(2, "0")}</i>
      </div>

      <div className={s.manaBlock}>
        <div className={s.manaRow} title="法力水晶（每回合的出牌资源）">
          {Array.from({ length: Math.max(maxMana, mana) }, (_, index) => (
            <ManaCrystalIcon key={index} className={s.manaCrystal} off={index >= mana} />
          ))}
        </div>
        <div className={s.manaValue}>{String(mana).padStart(2, "0")}<i>/{String(maxMana).padStart(2, "0")}</i></div>
        <div className={s.preview} aria-live="polite">
          <span>{previewCard ? `使用「${previewCard.name}」 −${String(previewCard.cost).padStart(2, "0")}` : "\u00a0"}</span>
          <span className={preview != null ? (preview < 0 ? s.insufficient : "") : ""}>
            {preview != null ? `剩余        ${String(Math.max(0, preview)).padStart(2, "0")}/${String(maxMana).padStart(2, "0")}` : "\u00a0"}
          </span>
        </div>
      </div>

      <div className={s.rule} />
      <div className={s.toolGrid}>
        <PileButton label="抽牌" count={battle.draw.length} icon="▤" onClick={() => onOpenPile("draw")} />
        <PileButton label="弃牌" count={battle.discard.length} icon="▥" onClick={() => onOpenPile("discard")} />
        <PileButton label="消耗" count={battle.exhaust.length} icon="⌁" onClick={() => onOpenPile("exhaust")} />
        <button
          className={`${s.toolButton} ${handAction === "redraw" ? s.active : ""}`}
          type="button"
          aria-label="换牌"
          title={battle.redrawsThisRound >= 1 ? "本回合已换牌" : "换牌：选择一张手牌替换"}
          disabled={!redrawAvailable}
          onClick={() => onToggleHandAction("redraw")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.8-4.2L3 9m0-5v5h5M4 13a8 8 0 0 0 14.8 4.2L21 15m0 5v-5h-5" /></svg>
          <span>换牌</span>
        </button>
        <button
          className={`${s.toolButton} ${handAction === "discard" ? s.active : ""}`}
          type="button"
          aria-label="丢弃"
          title="丢弃：选择一张手牌置入弃牌堆"
          disabled={!canUseHandActions}
          onClick={() => onToggleHandAction("discard")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>
          <span>丢弃</span>
        </button>
        <span className={s.emptyTool} aria-hidden />
      </div>
    </section>
  );
}
