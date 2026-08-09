import { useEffect, useState, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";
import type { Card } from "@/engine";
import { DeckMinusGlyph, DeckPlusGlyph } from "./ForgeGlyphs";
import { ForgeDrawStage } from "./ForgeDrawStage";
import { ForgeRemoveStage } from "./ForgeRemoveStage";
import { VEIL_MS } from "./forgeChoreo";
import s from "./DeckForgeOverlay.module.css";

interface Props {
  mode: "draw" | "remove";
  pendingDraw: string[] | null;
  deck: Card[];
  minDeckSize: number;
  onPickDraw: (cardDefId: string) => void;
  onRemoveCard: (uid: string) => void;
  playDrawIntro: boolean;
  onIntroConsumed: () => void;
  onComplete: () => void;
  onClose: () => void;
}

export function DeckForgeOverlay({
  mode,
  pendingDraw,
  deck,
  minDeckSize,
  onPickDraw,
  onRemoveCard,
  playDrawIntro,
  onIntroConsumed,
  onComplete,
  onClose,
}: Props) {
  const [intro] = useState(playDrawIntro);
  const [busy, setBusy] = useState(() => intro && !prefersReducedMotion());

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
    <div
      className={s["forge-overlay"]}
      data-busy={busy ? "true" : "false"}
      data-intro={intro ? "true" : "false"}
      style={{ "--veil-ms": `${VEIL_MS}ms` } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label={mode === "draw" ? "扩充卡组" : "精简卡组"}
    >
      <button
        className={s["forge-backdrop"]}
        type="button"
        aria-label="关闭卡组锻造"
        disabled={busy}
        onClick={() => !busy && onClose()}
      />
      <section className={s["forge-modal"]}>
        <header className={s["forge-head"]}>
          <span className={s["forge-mode-icon"]} aria-hidden="true">
            {mode === "draw" ? <DeckPlusGlyph /> : <DeckMinusGlyph />}
          </span>
          <button
            className={s["forge-close"]}
            type="button"
            disabled={busy}
            onClick={() => !busy && onClose()}
            aria-label="关闭卡组锻造"
          >
            ×
          </button>
        </header>

        {mode === "draw" ? (
          <ForgeDrawStage
            pendingDraw={pendingDraw}
            playIntro={intro}
            onPick={onPickDraw}
            onComplete={onComplete}
            onBusyChange={setBusy}
            onIntroConsumed={onIntroConsumed}
          />
        ) : (
          <ForgeRemoveStage
            deck={deck}
            minDeckSize={minDeckSize}
            onRemove={onRemoveCard}
            onComplete={onComplete}
            onBusyChange={setBusy}
          />
        )}
      </section>
    </div>
  );
}
