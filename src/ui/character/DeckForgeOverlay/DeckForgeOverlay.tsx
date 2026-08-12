import { useEffect, useState, type CSSProperties } from "react";
import type { Card, Rarity } from "@/engine";
import { ModalReveal, modalRevealVars, useModalReveal } from "@/ui/common/ModalReveal";
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
}: Props) {
  const [busy, setBusy] = useState(false);
  const closeReveal = useModalReveal(onClose, busy);
  const completeReveal = useModalReveal(onComplete);
  const closing = closeReveal.closing || completeReveal.closing;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) closeReveal.requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, closeReveal.requestClose]);

  return (
    <div
      className={s["forge-overlay"]}
      data-busy={busy ? "true" : "false"}
      data-closing={closing ? "true" : undefined}
      style={{
        ...modalRevealVars(),
        "--forge-w": "1000px",
      } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label={mode === "draw" ? "扩充卡组" : "精简卡组"}
    >
      <button
        className={s["forge-backdrop"]}
        type="button"
        aria-label="关闭卡组锻造"
        disabled={busy}
        onClick={closeReveal.requestClose}
      />
      <ModalReveal closing={closing} className={s["forge-reveal"]}>
        <section className={s["forge-modal"]}>
          <header className={s["forge-head"]}>
            <span className={s["forge-mode-icon"]} aria-hidden="true">
              {mode === "draw" ? <DeckPlusGlyph /> : <DeckMinusGlyph />}
            </span>
            <button
              className={s["forge-close"]}
              type="button"
              disabled={busy}
              onClick={closeReveal.requestClose}
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
              onComplete={completeReveal.requestClose}
              onBusyChange={setBusy}
            />
          ) : (
            <ForgeRemoveStage
              deck={deck}
              minDeckSize={minDeckSize}
              onRemove={onRemoveCard}
              onComplete={completeReveal.requestClose}
              onBusyChange={setBusy}
            />
          )}
        </section>
      </ModalReveal>
    </div>
  );
}
