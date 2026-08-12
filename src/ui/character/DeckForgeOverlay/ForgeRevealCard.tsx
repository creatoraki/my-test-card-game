import type { CSSProperties } from "react";
import type { Card } from "@/engine";
import { RARITY_CRYSTAL_ART } from "@/ui/art/rarityArt";
import { cx } from "@/ui/common/cx";
import { DeckCard } from "@/ui/character/DeckCard";
import {
  BACK_MS,
  BACK_STAGGER_MS,
  COMMIT_MS,
  FLIP_MS_BY_RARITY,
  IMPACT_MS,
  RARE_BREATH_MS,
  SETTLE_MS,
  rarityOf,
} from "./forgeChoreo";
import s from "./ForgeRevealCard.module.css";

export type ForgeRevealPhase = "veil" | "back" | "flip" | "settle" | "ready" | "dissolve" | "commit";

export interface ForgeRevealFlight {
  x: number;
  y: number;
  scale: number;
}

export interface ForgeRevealCardProps {
  card: Card;
  index: number;
  phase: ForgeRevealPhase;
  flipMs: number;
  delayMs: number;
  selected: boolean;
  onClick: () => void;
  flight?: ForgeRevealFlight;
}

export function ForgeRevealCard({
  card,
  index,
  phase,
  flipMs,
  delayMs,
  selected,
  onClick,
  flight,
}: ForgeRevealCardProps) {
  const rarity = rarityOf(card);
  const style = {
    "--flip-ms": `${flipMs || FLIP_MS_BY_RARITY[rarity]}ms`,
    "--flip-delay": `${delayMs}ms`,
    "--back-ms": `${BACK_MS}ms`,
    "--back-delay": `${index * BACK_STAGGER_MS}ms`,
    "--impact-ms": `${IMPACT_MS}ms`,
    "--impact-delay": `${delayMs + (flipMs || FLIP_MS_BY_RARITY[rarity]) * 0.58}ms`,
    "--settle-ms": `${SETTLE_MS}ms`,
    "--breath-ms": `${RARE_BREATH_MS}ms`,
    "--commit-ms": `${COMMIT_MS}ms`,
    "--flight-x": `${flight?.x ?? 0}px`,
    "--flight-y": `${flight?.y ?? 0}px`,
    "--flight-scale": flight?.scale ?? 0.2,
  } as CSSProperties;

  return (
    <div
      className={cx(s["reveal-card"], selected && s["is-selected"])}
      data-forge-card={card.uid}
      data-phase={phase}
      data-rarity={rarity}
      style={style}
    >
      <div className={s["flip"]}>
        <div className={s["face-back"]} aria-hidden="true">
          <span className={s["back-pattern"]} />
          <img className={s["back-crystal"]} src={RARITY_CRYSTAL_ART.common} alt="" draggable={false} />
          <span className={s["back-sheen"]} />
        </div>
        <div className={s["face-front"]}>
          <DeckCard
            card={card}
            index={index}
            selected={selected}
            onClick={onClick}
            className={s["front-card"]}
          />
        </div>
      </div>
      <span className={s["flash"]} aria-hidden="true" />
      <span className={s["shock"]} aria-hidden="true" />
      <span className={cx(s["edge-node"], s["edge-top-left"])} aria-hidden="true" />
      <span className={cx(s["edge-node"], s["edge-top-right"])} aria-hidden="true" />
      <span className={cx(s["edge-node"], s["edge-bottom-left"])} aria-hidden="true" />
      <span className={cx(s["edge-node"], s["edge-bottom-right"])} aria-hidden="true" />
    </div>
  );
}