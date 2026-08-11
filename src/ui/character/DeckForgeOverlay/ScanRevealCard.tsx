import type { CSSProperties } from "react";
import type { Card } from "@/engine";
import { cx } from "@/ui/common/cx";
import { DeckCard } from "@/ui/character/DeckCard";
import {
  COMMIT_MS,
  FRAME_MS,
  FRAME_STAGGER_MS,
  RARE_BREATH_MS,
  RARE_RIPPLE_MS,
  RARITY_SWEEP_MS,
  SETTLE_MS,
  rarityOf,
} from "./forgeChoreo";
import s from "./ScanRevealCard.module.css";

export type ScanRevealPhase = "veil" | "frame" | "scan" | "settle" | "ready" | "dissolve" | "commit";

export interface ScanRevealFlight {
  x: number;
  y: number;
  scale: number;
}

export interface ScanRevealCardProps {
  card: Card;
  index: number;
  phase: ScanRevealPhase;
  scanMs: number;
  delayMs: number;
  selected: boolean;
  onClick: () => void;
  flight?: ScanRevealFlight;
}

export function ScanRevealCard({
  card,
  index,
  phase,
  scanMs,
  delayMs,
  selected,
  onClick,
  flight,
}: ScanRevealCardProps) {
  const rarity = rarityOf(card);
  const style = {
    "--scan-ms": `${scanMs}ms`,
    "--scan-delay": `${delayMs}ms`,
    "--frame-ms": `${FRAME_MS}ms`,
    "--frame-delay": `${index * FRAME_STAGGER_MS}ms`,
    "--settle-ms": `${SETTLE_MS}ms`,
    "--sweep-ms": `${RARITY_SWEEP_MS}ms`,
    "--ripple-ms": `${RARE_RIPPLE_MS}ms`,
    "--breath-ms": `${RARE_BREATH_MS}ms`,
    "--commit-ms": `${COMMIT_MS}ms`,
    "--flight-x": `${flight?.x ?? 0}px`,
    "--flight-y": `${flight?.y ?? 0}px`,
    "--flight-scale": flight?.scale ?? 0.2,
  } as CSSProperties;

  return (
    <div
      className={cx(s["scan-card"], selected && s["is-selected"])}
      data-forge-card={card.uid}
      data-phase={phase}
      data-rarity={rarity}
      style={style}
    >
      <DeckCard
        card={card}
        index={index}
        selected={selected}
        onClick={onClick}
        className={s["scan-card-card"]}
      />
      <svg className={s["frame"]} viewBox="0 0 100 155" preserveAspectRatio="none" aria-hidden="true">
        <path
          className={s["frame-line"]}
          d="M8 1H38M62 1H92M99 8V42M99 113V147M92 154H62M38 154H8M1 147V113M1 42V8"
          pathLength="1"
        />
      </svg>
      <span className={cx(s["edge-node"], s["edge-top-left"])} aria-hidden="true" />
      <span className={cx(s["edge-node"], s["edge-top-right"])} aria-hidden="true" />
      <span className={cx(s["edge-node"], s["edge-bottom-left"])} aria-hidden="true" />
      <span className={cx(s["edge-node"], s["edge-bottom-right"])} aria-hidden="true" />
      <span className={s["scan-line"]} aria-hidden="true" />
      <span className={s["rarity-sweep"]} aria-hidden="true" />
      <span className={s["rarity-ripple"]} aria-hidden="true" />
    </div>
  );
}