import { useEffect, useRef, useState } from "react";
import type { Card } from "@/engine";
import { ConfirmGlyph } from "./ForgeGlyphs";
import { COMMIT_MS } from "./forgeChoreo";
import { ForgeRevealCard, type ForgeRevealPhase } from "./ForgeRevealCard";
import { DeckStackGlyph, LockGlyph } from "@/ui/character/glyphs/deckGlyphs";
import { cx } from "@/ui/common/cx";
import s from "./ForgeRemoveStage.module.css";

type RemoveStagePhase = "ready" | "commit";

interface Props {
  deck: Card[];
  minDeckSize: number;
  onRemove: (uid: string) => void;
  onComplete: () => void;
  onBusyChange: (busy: boolean) => void;
}

export function ForgeRemoveStage({ deck, minDeckSize, onRemove, onComplete, onBusyChange }: Props) {
  const [cards] = useState<Card[]>(() => deck);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [phase, setPhase] = useState<RemoveStagePhase>("ready");
  const runIdRef = useRef(0);
  const selectedCard = cards.find((card) => card.uid === selectedUid) ?? null;
  const canRemove = cards.length > minDeckSize;

  useEffect(() => {
    onBusyChange(phase !== "ready");
  }, [onBusyChange, phase]);

  useEffect(() => {
    if (phase !== "commit") return;
    const runId = runIdRef.current;
    const timer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      onComplete();
    }, COMMIT_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete, phase]);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
    };
  }, []);

  const startCommit = () => {
    if (phase !== "ready" || !selectedCard || !canRemove) return;
    runIdRef.current += 1;
    setPhase("commit");
    onRemove(selectedCard.uid);
  };

  return (
    <div className={s["remove-stage"]} data-phase={phase}>
      <div className={s["remove-grid"]}>
        {cards.map((card, index) => {
          const isRemoving = phase === "commit" && card.uid === selectedUid;
          const selected = phase === "ready" && card.uid === selectedUid;
          const cardPhase: ForgeRevealPhase = isRemoving ? "dissolve" : "ready";
          return (
            <div className={s["remove-choice"]} key={card.uid}>
              <ForgeRevealCard
                card={card}
                index={index}
                phase={cardPhase}
                flipMs={0}
                delayMs={0}
                selected={selected}
                onClick={() => {
                  if (phase === "ready") setSelectedUid(card.uid);
                }}
              />
            </div>
          );
        })}
      </div>
      <footer className={s["remove-actions"]}>
        <div
          className={cx(s["remove-count"], !canRemove && s["is-locked"])}
          aria-label={`卡组 ${cards.length} 张，移除后 ${cards.length - 1} 张`}
        >
          {canRemove ? <DeckStackGlyph /> : <LockGlyph />}
          <strong>
            {cards.length} → {cards.length - 1}
          </strong>
        </div>
        <button
          className={s["remove-confirm"]}
          type="button"
          disabled={phase !== "ready" || !selectedCard || !canRemove}
          aria-label="确认移除所选卡牌"
          onClick={startCommit}
        >
          <ConfirmGlyph />
          <span>移除</span>
        </button>
      </footer>
    </div>
  );
}