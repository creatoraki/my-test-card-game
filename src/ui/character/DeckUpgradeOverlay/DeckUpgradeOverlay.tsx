import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Rarity } from "@/engine";
import { deckRarityChances, deckUpgradeCost } from "@/engine";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { ModalReveal, modalRevealVars, useModalReveal } from "@/ui/common/ModalReveal";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { useHoldCharge } from "@/ui/hooks/useHoldCharge";
import { DeckStackGlyph, ExpShardGlyph, LevelBadge, LockGlyph, MaxGlyph, RarityCrystal } from "@/ui/character/glyphs/deckGlyphs";
import s from "./DeckUpgradeOverlay.module.css";

const FILL_MS = 720;
const BURST_MS = 900;
const SETTLE_MS = 420;
const CHARGE_MS = 700;

const RARITIES: { id: Rarity; label: string }[] = [
  { id: "common", label: "普通" },
  { id: "uncommon", label: "罕见" },
  { id: "rare", label: "稀有" },
];

type Phase = "idle" | "filling" | "levelup" | "settle";

interface PanelView {
  level: number;
  exp: number;
  upgradeCost: number | null;
  nextUpgradeCost: number | null;
  deckSize: number;
  minDeckSize: number;
  hasPool: Record<Rarity, boolean>;
}

interface Snapshot extends PanelView {
  fillMs: number;
  burstMs: number;
}

export interface DeckUpgradeOverlayProps {
  deckLevel: number;
  levelMax: number;
  exp: number;
  upgradeCost: number | null;
  nextUpgradeCost: number | null;
  deckSize: number;
  minDeckSize: number;
  hasPool: Record<Rarity, boolean>;
  canUpgrade: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function percentage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

function fillOf(exp: number, cost: number | null): number {
  if (cost == null || cost <= 0) return 1;
  return Math.max(0, Math.min(1, exp / cost));
}

function targetView(snapshot: Snapshot): PanelView {
  return {
    level: snapshot.level + 1,
    exp: Math.max(0, snapshot.exp - (snapshot.upgradeCost ?? 0)),
    upgradeCost: snapshot.nextUpgradeCost,
    nextUpgradeCost: deckUpgradeCost(snapshot.level + 1),
    deckSize: snapshot.deckSize,
    minDeckSize: snapshot.minDeckSize,
    hasPool: snapshot.hasPool,
  };
}

export function DeckUpgradeOverlay({
  deckLevel,
  levelMax,
  exp,
  upgradeCost,
  nextUpgradeCost,
  deckSize,
  minDeckSize,
  hasPool,
  canUpgrade,
  onConfirm,
  onClose,
}: DeckUpgradeOverlayProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [settlePct, setSettlePct] = useState(0);
  const [settleReady, setSettleReady] = useState(false);
  const snapshotRef = useRef<Snapshot | null>(null);
  const runIdRef = useRef(0);
  const busy = phase !== "idle";
  const closeReveal = useModalReveal(onClose, busy);
  const closing = closeReveal.closing;

  const currentView: PanelView = {
    level: deckLevel,
    exp,
    upgradeCost,
    nextUpgradeCost,
    deckSize,
    minDeckSize,
    hasPool,
  };
  const view = phase === "levelup" || phase === "settle" ? (snapshot ? targetView(snapshot) : currentView) : phase === "filling" && snapshot ? snapshot : currentView;
  const levelupTarget = phase === "levelup";
  const showLevelTransition =
    (phase === "filling" || levelupTarget) &&
    snapshot != null &&
    snapshot.level < levelMax;
  const showNextChance = view.upgradeCost != null && view.level < levelMax;
  const displayExpTarget = phase === "filling" && snapshot ? snapshot.upgradeCost ?? snapshot.exp : view.exp;
  const shownExp = useCountUp(
    Math.round(displayExpTarget),
    0,
    phase === "filling" ? (snapshot?.fillMs ?? FILL_MS) : phase === "levelup" ? 0 : 420,
  );
  const displayPct = phase === "filling" ? 1 : phase === "settle" ? settlePct : phase === "levelup" ? 1 : fillOf(view.exp, view.upgradeCost);
  const fillMs = phase === "settle" ? SETTLE_MS : snapshot?.fillMs ?? FILL_MS;
  const currentChances = useMemo(
    () => deckRarityChances(view.level, view.hasPool),
    [view.level, view.hasPool],
  );
  const nextChances = useMemo(
    () => (showNextChance ? deckRarityChances(view.level + 1, view.hasPool) : null),
    [showNextChance, view.level, view.hasPool],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) closeReveal.requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, closeReveal.requestClose]);

  useEffect(() => {
    if (phase !== "filling") return;
    const runId = runIdRef.current;
    const timer = window.setTimeout(() => {
      if (runId !== runIdRef.current || !snapshotRef.current) return;
      onConfirm();
      setPhase("levelup");
    }, snapshot?.fillMs ?? FILL_MS);
    return () => window.clearTimeout(timer);
  }, [onConfirm, phase, snapshot?.fillMs]);

  useEffect(() => {
    if (phase !== "levelup") return;
    const runId = runIdRef.current;
    const timer = window.setTimeout(() => {
      if (runId !== runIdRef.current) return;
      if ((snapshotRef.current?.burstMs ?? BURST_MS) === 0) {
        snapshotRef.current = null;
        setSnapshot(null);
        setPhase("idle");
        return;
      }
      setPhase("settle");
    }, snapshot?.burstMs ?? BURST_MS);
    return () => window.clearTimeout(timer);
  }, [phase, snapshot?.burstMs]);

  useEffect(() => {
    if (phase !== "settle" || !snapshot) return;
    const runId = runIdRef.current;
    const next = targetView(snapshot);
    let nextFrame = 0;
    setSettleReady(false);
    setSettlePct(0);
    const frame = requestAnimationFrame(() => {
      if (runId !== runIdRef.current) return;
      setSettleReady(true);
      setSettlePct(fillOf(next.exp, next.upgradeCost));
      nextFrame = requestAnimationFrame(() => {
        if (runId !== runIdRef.current) return;
        snapshotRef.current = null;
        setSnapshot(null);
        setSettleReady(false);
        setSettlePct(0);
        setPhase("idle");
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(nextFrame);
    };
  }, [phase, snapshot]);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      snapshotRef.current = null;
    };
  }, []);

  const confirmUpgrade = () => {
    if (busy || !canUpgrade || upgradeCost == null) return;
    const nextSnapshot: Snapshot = {
      ...currentView,
      hasPool: { ...hasPool },
      fillMs: prefersReducedMotion() ? 0 : FILL_MS,
      burstMs: prefersReducedMotion() ? 0 : BURST_MS,
    };
    runIdRef.current += 1;
    snapshotRef.current = nextSnapshot;
    setSnapshot(nextSnapshot);
    setSettleReady(false);
    setPhase("filling");
  };

  const pulseFull = phase === "filling" && snapshot != null && snapshot.exp >= (snapshot.upgradeCost ?? 0);
  const phaseClass = phase === "settle" && settleReady ? s["is-settle-ready"] : undefined;
  const badgeLevel = showLevelTransition && snapshot ? snapshot.level : view.level;
  const badgeTargetLevel = snapshot ? snapshot.level + 1 : view.level + 1;
  const baseExpPct = fillOf(view.exp, view.upgradeCost);
  const { progress: chargeProgress, holding, bind: holdBind } = useHoldCharge({
    ms: CHARGE_MS,
    disabled: !canUpgrade || busy,
    onComplete: confirmUpgrade,
  });
  const chargePct = baseExpPct + (1 - baseExpPct) * chargeProgress;
  const chargeReady = holding && chargeProgress >= 0.82;
  const statusLabel = view.upgradeCost == null ? "已达上限" : !canUpgrade ? "经验不足" : "";

  return (
    <div
      className={cx(s["upg-overlay"], s[`is-${phase}`], phaseClass, holding && s["is-holding"], chargeReady && s["is-charge-ready"])}
      data-closing={closing ? "true" : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="卡组升级"
      style={{
        ...modalRevealVars(),
        "--exp-pct": displayPct,
        "--fill-ms": `${fillMs}ms`,
        "--charge": chargeProgress,
        "--charge-pct": chargePct,
      } as CSSProperties}
    >
      <button className={s["upg-backdrop"]} type="button" aria-label="关闭卡组升级" onClick={closeReveal.requestClose} />
      <ModalReveal closing={closing} className={s["upg-reveal"]}>
        <section className={s["upg-modal"]}>
          <header className={s["upg-head"]}>
            <h2 className={s["upg-title"]}>卡组升级</h2>
            <button className={s["upg-close"]} type="button" onClick={closeReveal.requestClose} aria-label="关闭">
              ×
            </button>
          </header>

        <div className={s["upg-body"]}>
          <div className={s["upg-primary"]}>
            <div className={s["upg-badge-block"]}>
              <div className={s["upg-burst"]} aria-hidden="true">
                <span className={s["upg-ring"]} />
              </div>
              <div className={s["upg-badge-current"]}>
                <LevelBadge level={badgeLevel} levelMax={levelMax} />
              </div>
              {showLevelTransition && snapshot && (
                <div className={s["upg-badge-target"]} aria-hidden="true">
                  <LevelBadge level={badgeTargetLevel} levelMax={levelMax} />
                </div>
              )}
              {!showLevelTransition && !showNextChance && <span className={s["upg-cap"]}>已达上限</span>}
            </div>

            <div className={s["upg-chips"]}>
              <div className={s["upg-chip"]} aria-label={`卡组 ${view.deckSize} 张，最低 ${view.minDeckSize} 张`}>
                <DeckStackGlyph />
                <strong>
                  {view.deckSize}/{view.minDeckSize}
                </strong>
              </div>
              <div className={s["upg-chip"]} aria-label={`当前经验 ${view.exp}`}>
                <ExpShardGlyph />
                <strong>{view.exp}</strong>
              </div>
              <div className={s["upg-chip"]} aria-label={`升级所需经验 ${view.upgradeCost ?? "MAX"}`}>
                {view.upgradeCost == null ? (
                  <MaxGlyph />
                ) : (
                  <LevelBadge level={Math.min(levelMax, view.level + 1)} levelMax={levelMax} />
                )}
                <strong>{view.upgradeCost ?? "MAX"}</strong>
              </div>
            </div>

            <div className={s["upg-exp"]}>
              <div className={s["upg-exp-head"]}>
                <span>EXP</span>
                <strong>
                  {shownExp} / {view.upgradeCost == null ? "MAX" : view.upgradeCost}
                </strong>
              </div>
              <div
                className={s["upg-exp-track"]}
                role="progressbar"
                aria-label="卡组升级经验"
                aria-valuemin={0}
                aria-valuemax={view.upgradeCost ?? 1}
                aria-valuenow={view.upgradeCost == null ? 1 : shownExp}
              >
                <div className={cx(s["upg-exp-fill"], pulseFull && s["is-pulse"])} />
                <div className={s["upg-exp-charge"]} aria-hidden="true" />
                <span className={s["upg-exp-glint"]} aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className={s["upg-probability"]} aria-label="稀有度抽取概率">
            <div className={s["upg-probability-head"]} aria-hidden="true">
              <span>当前 Lv.{view.level}</span>
              {showNextChance ? <span>下一等级 Lv.{view.level + 1}</span> : <span>MAX</span>}
            </div>
            <div className={s["upg-rarity-grid"]}>
              {RARITIES.map(({ id, label }) => {
                const available = view.hasPool[id];
                const current = currentChances[id];
                const next = nextChances?.[id];
                const delta = next == null ? 0 : next - current;
                const deltaVisible = available && next != null && delta !== 0;
                return (
                  <div
                    className={cx(
                      s["upg-rarity-col"],
                      !available && s["is-empty"],
                      delta !== 0 && available && s["is-changed"],
                      delta > 0 && available && s["is-rising"],
                    )}
                    key={id}
                    aria-label={`${label}：${available ? percentage(current) : "无可用卡池"}`}
                  >
                    {deltaVisible && <span className={s["upg-delta"]}>{`${delta >= 0 ? "+" : ""}${percentage(delta)}`}</span>}
                    <RarityCrystal rarity={id} muted={!available} className={s["rarity-crystal"]} />
                    <div className={s["upg-rarity-values"]}>
                      <strong className={s["upg-rarity-value"]}>{available ? percentage(current) : "—"}</strong>
                      {showNextChance && next != null && available && (
                        <>
                          <span className={s["upg-rarity-arrow"]} aria-hidden="true">→</span>
                          <span className={s["upg-rarity-next"]}>{percentage(next)}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={s["upg-ratio-bars"]}>
              <div className={s["upg-ratio-bar"]} aria-hidden="true">
                {RARITIES.map(({ id }) => (
                  <span
                    className={cx(s["upg-ratio-seg"], !view.hasPool[id] && s["is-empty"])}
                    key={id}
                    style={{ flexBasis: `${currentChances[id]}%` }}
                  />
                ))}
              </div>
              {showNextChance && nextChances && (
                <div className={cx(s["upg-ratio-bar"], s["is-next"])} data-next aria-hidden="true">
                  {RARITIES.map(({ id }) => (
                    <span
                      className={cx(s["upg-ratio-seg"], !view.hasPool[id] && s["is-empty"])}
                      key={id}
                      style={{ flexBasis: `${nextChances[id]}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className={s["upg-foot"]}>
          <span className={s["upg-status"]} aria-label={statusLabel || undefined}>
            {statusLabel === "经验不足" && <LockGlyph />}
            {statusLabel === "已达上限" && <MaxGlyph />}
          </span>
          <button
            className={s["upg-button"]}
            type="button"
            disabled={!canUpgrade || busy}
            aria-label={busy ? "升级中" : holding ? `蓄力 ${Math.round(chargeProgress * 100)}%` : "长按升级"}
            {...holdBind}
          >
            <span className={s["upg-button-charge"]} aria-hidden="true" />
            <span className={s["upg-button-sweep"]} aria-hidden="true" />
            <svg className={s["upg-button-ring"]} viewBox="0 0 160 56" preserveAspectRatio="none" aria-hidden="true">
              <path className={s["upg-button-ring-track"]} d="M10 1h149v43l-9 10H1V10Z" pathLength="1" />
              <path
                className={s["upg-button-ring-fill"]}
                d="M10 1h149v43l-9 10H1V10Z"
                pathLength="1"
                strokeDasharray="1"
                style={{ strokeDashoffset: 1 - chargeProgress }}
              />
            </svg>
            <span className={s["upg-button-label"]}>{busy ? "升级中" : "升级"}</span>
            {holding && <span className={s["upg-button-percent"]}>{Math.round(chargeProgress * 100)}%</span>}
          </button>
        </footer>
        </section>
      </ModalReveal>
    </div>
  );
}
