import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Card, Rarity } from "@/engine";
import { makeCard } from "@/data";
import { ConfirmGlyph } from "./ForgeGlyphs";
import { ForgeDrawBrief } from "./ForgeDrawBrief";
import { ExpShardGlyph } from "@/ui/character/glyphs/deckGlyphs";
import {
  COMMIT_MS,
  EXP_FLIGHT_MS,
  FRAME_MS,
  FRAME_STAGGER_MS,
  SETTLE_MS,
  SPEND_MS,
  VEIL_MS,
  revealOrder,
} from "./forgeChoreo";
import { ScanRevealCard, type ScanRevealFlight, type ScanRevealPhase } from "./ScanRevealCard";
import s from "./ForgeDrawStage.module.css";

type DrawStagePhase = "brief" | "spend" | "veil" | "frame" | "scan" | "settle" | "ready" | "commit";

interface ExpFlight {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface Props {
  pendingDraw: string[] | null;
  drawCost: number;
  exp: number;
  deckLevel: number;
  deckSize: number;
  minDeckSize: number;
  hasPool: Record<Rarity, boolean>;
  canConfirmDraw: boolean;
  drawDisabledReason?: string;
  onStartDraw: () => void;
  onPick: (cardDefId: string) => void;
  onComplete: () => void;
  onBusyChange: (busy: boolean) => void;
}

function measureFlight(stage: HTMLDivElement | null, uid: string): ScanRevealFlight {
  const source = Array.from(stage?.querySelectorAll<HTMLElement>("[data-forge-card]") ?? []).find(
    (element) => element.dataset.forgeCard === uid,
  );
  const target = document.querySelector<HTMLElement>("[data-deck-anchor]");

  if (!source) return { x: 0, y: 220, scale: 0.2 };

  const sourceRect = source.getBoundingClientRect();
  const scale = source.offsetWidth > 0 ? sourceRect.width / source.offsetWidth : 1;
  if (!target) return { x: 0, y: 220 / scale, scale: 0.2 };

  const targetRect = target.getBoundingClientRect();
  return {
    x: (targetRect.left - sourceRect.left) / scale,
    y: (targetRect.top - sourceRect.top) / scale,
    scale: Math.max(0.16, Math.min(0.42, (targetRect.width / Math.max(sourceRect.width, 1)) * 0.22)),
  };
}

function measureExpFlight(stage: HTMLDivElement | null): ExpFlight {
  const fallback = { startX: 72, startY: 360, endX: 150, endY: 150 };
  if (!stage) return fallback;

  const stageRect = stage.getBoundingClientRect();
  const scale = stage.offsetWidth > 0 ? stageRect.width / stage.offsetWidth : 1;
  const source = stage.querySelector<HTMLElement>("[data-forge-charge]");
  const target = stage.querySelector<HTMLElement>("[data-forge-card]");
  if (!source || !target) return fallback;

  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  return {
    startX: (sourceRect.left + sourceRect.width / 2 - stageRect.left) / scale,
    startY: (sourceRect.top + sourceRect.height / 2 - stageRect.top) / scale,
    endX: (targetRect.left + targetRect.width / 2 - stageRect.left) / scale,
    endY: (targetRect.top + targetRect.height / 2 - stageRect.top) / scale,
  };
}

export function ForgeDrawStage({
  pendingDraw,
  drawCost,
  exp,
  deckLevel,
  deckSize,
  minDeckSize,
  hasPool,
  canConfirmDraw,
  drawDisabledReason,
  onStartDraw,
  onPick,
  onComplete,
  onBusyChange,
}: Props) {
  const [drawCards, setDrawCards] = useState<Card[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [flight, setFlight] = useState<ScanRevealFlight | null>(null);
  const [expFlight, setExpFlight] = useState<ExpFlight | null>(null);
  const [drawFailure, setDrawFailure] = useState<string | null>(null);
  const [phase, setPhase] = useState<DrawStagePhase>(() => (pendingDraw ? "veil" : "brief"));
  const stageRef = useRef<HTMLDivElement>(null);
  const runIdRef = useRef(0);
  const drawCardsLockedRef = useRef(false);

  const revealPlans = useMemo(
    () => revealOrder(drawCards).sort((left, right) => left.index - right.index),
    [drawCards],
  );
  const frameWindowMs = FRAME_MS + Math.max(0, drawCards.length - 1) * FRAME_STAGGER_MS;
  const scanWindowMs = revealPlans.reduce(
    (latest, plan) => Math.max(latest, plan.delay + plan.duration),
    0,
  );
  const selectedCard = drawCards.find((card) => card.uid === selectedUid) ?? null;

  useEffect(() => {
    if (!pendingDraw || drawCardsLockedRef.current) return;
    drawCardsLockedRef.current = true;
    setDrawCards(pendingDraw.map((cardId) => makeCard(cardId)));
  }, [pendingDraw]);

  useEffect(() => {
    if (phase !== "spend") return;
    if (!pendingDraw) {
      const frame = window.requestAnimationFrame(() => {
        setDrawFailure("本次摇到的稀有度已达携带上限，经验未扣除");
        setPhase("brief");
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const frame = window.requestAnimationFrame(() => {
      setExpFlight(measureExpFlight(stageRef.current));
    });
    const timer = window.setTimeout(() => setPhase("veil"), SPEND_MS);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pendingDraw, phase]);

  useEffect(() => {
    onBusyChange(phase !== "brief" && phase !== "ready");
  }, [onBusyChange, phase]);

  useEffect(() => {
    const runId = runIdRef.current;
    let timer: number | undefined;
    const advance = (nextPhase: DrawStagePhase, waitMs: number) => {
      timer = window.setTimeout(() => {
        if (runId !== runIdRef.current) return;
        setPhase(nextPhase);
      }, waitMs);
    };

    if (phase === "veil" && drawCards.length > 0) advance("frame", VEIL_MS);
    if (phase === "frame") advance("scan", frameWindowMs);
    if (phase === "scan") advance("settle", scanWindowMs);
    if (phase === "settle") advance("ready", SETTLE_MS);
    if (phase === "commit") {
      timer = window.setTimeout(() => {
        if (runId !== runIdRef.current) return;
        onComplete();
      }, COMMIT_MS);
    }

    return () => {
      if (timer != null) window.clearTimeout(timer);
    };
  }, [drawCards.length, frameWindowMs, onComplete, phase, scanWindowMs]);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
    };
  }, []);

  const startCommit = () => {
    if (phase !== "ready" || !selectedCard) return;
    runIdRef.current += 1;
    setFlight(measureFlight(stageRef.current, selectedCard.uid));
    setPhase("commit");
    onPick(selectedCard.id);
  };

  const startDraw = () => {
    if (phase !== "brief") return;
    setDrawFailure(null);
    onStartDraw();
    setPhase("spend");
  };

  const showBrief = phase === "brief" || phase === "spend";

  return (
    <div ref={stageRef} className={s["draw-stage"]} data-phase={phase}>
      {expFlight && (phase === "spend" || phase === "veil") && (
        <span
          className={s["draw-exp-shard"]}
          aria-hidden="true"
          style={
            {
              "--exp-start-x": `${expFlight.startX}px`,
              "--exp-start-y": `${expFlight.startY}px`,
              "--exp-end-x": `${expFlight.endX}px`,
              "--exp-end-y": `${expFlight.endY}px`,
              "--exp-flight-ms": `${EXP_FLIGHT_MS}ms`,
            } as CSSProperties
          }
        >
          <ExpShardGlyph />
        </span>
      )}
      {phase === "spend" && drawCards[0] && (
        <div className={s["draw-measure-target"]} aria-hidden="true">
          <ScanRevealCard
            card={drawCards[0]}
            index={0}
            phase="ready"
            scanMs={0}
            delayMs={0}
            selected={false}
            onClick={() => undefined}
          />
        </div>
      )}
      {showBrief ? (
        <ForgeDrawBrief
          drawCost={drawCost}
          exp={exp}
          deckLevel={deckLevel}
          deckSize={deckSize}
          minDeckSize={minDeckSize}
          hasPool={hasPool}
          canConfirmDraw={canConfirmDraw}
          drawDisabledReason={drawFailure ?? drawDisabledReason}
          charging={phase === "spend"}
          onStartDraw={startDraw}
        />
      ) : (
        <>
          <div className={s["draw-list"]}>
            {revealPlans.map((plan) => {
              const selected = plan.card.uid === selectedUid;
              const cardPhase: ScanRevealPhase =
                phase === "commit" ? (selected ? "commit" : "dissolve") : phase;
              return (
                <div className={s["draw-choice"]} key={plan.card.uid}>
                  <ScanRevealCard
                    card={plan.card}
                    index={plan.index}
                    phase={cardPhase}
                    scanMs={plan.duration}
                    delayMs={plan.delay}
                    selected={selected}
                    flight={selected ? flight ?? undefined : undefined}
                    onClick={() => {
                      if (phase === "ready") setSelectedUid(plan.card.uid);
                    }}
                  />
                </div>
              );
            })}
          </div>
          <footer className={s["draw-actions"]}>
            <button
              className={s["draw-confirm"]}
              type="button"
              disabled={phase !== "ready" || !selectedCard}
              aria-label="确认将所选卡牌加入卡组"
              onClick={startCommit}
            >
              <ConfirmGlyph />
              <span>确认</span>
            </button>
          </footer>
        </>
      )}
    </div>
  );
}