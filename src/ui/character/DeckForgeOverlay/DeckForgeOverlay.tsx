import type { Card, Rarity } from "@/engine";
import { DeckMinusGlyph, DeckPlusGlyph } from "./ForgeGlyphs";
import { ForgeDrawStage } from "./ForgeDrawStage";
import { ForgeRemoveStage } from "./ForgeRemoveStage";
import s from "./DeckForgeOverlay.module.css";

interface Props {
  mode: "draw" | "remove";
  pendingDraw: string[] | null;
  deck: Card[];
  minDeckSize: number;
  drawCost: number;
  exp: number;
  deckLevel: number;
  deckSize: number;
  hasPool: Record<Rarity, boolean>;
  canConfirmDraw: boolean;
  drawDisabledReason?: string;
  onStartDraw: () => void;
  onPickDraw: (cardDefId: string) => void;
  onRemoveCard: (uid: string) => void;
  onComplete: () => void;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
  busy: boolean;
}

export function DeckForgeOverlay({
  mode,
  pendingDraw,
  deck,
  minDeckSize,
  drawCost,
  exp,
  deckLevel,
  deckSize,
  hasPool,
  canConfirmDraw,
  drawDisabledReason,
  onStartDraw,
  onPickDraw,
  onRemoveCard,
  onComplete,
  onClose,
  onBusyChange,
  busy,
}: Props) {
  return (
    <>
      <header className={s["forge-head"]}>
        <span className={s["forge-mode-icon"]} aria-hidden="true">
          {mode === "draw" ? <DeckPlusGlyph /> : <DeckMinusGlyph />}
        </span>
        <h2 className={s["forge-title"]}>{mode === "draw" ? "扩充卡组" : "精简卡组"}</h2>
        <button
          className={s["forge-close"]}
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="关闭卡组锻造"
        >
          ×
        </button>
      </header>

      {mode === "draw" ? (
        <ForgeDrawStage
          pendingDraw={pendingDraw}
          drawCost={drawCost}
          exp={exp}
          deckLevel={deckLevel}
          deckSize={deckSize}
          minDeckSize={minDeckSize}
          hasPool={hasPool}
          canConfirmDraw={canConfirmDraw}
          drawDisabledReason={drawDisabledReason}
          onStartDraw={onStartDraw}
          onPick={onPickDraw}
          onComplete={onComplete}
          onBusyChange={onBusyChange}
        />
      ) : (
        <ForgeRemoveStage
          deck={deck}
          minDeckSize={minDeckSize}
          onRemove={onRemoveCard}
          onComplete={onComplete}
          onBusyChange={onBusyChange}
        />
      )}
    </>
  );
}
