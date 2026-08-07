import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Rarity } from "@/engine";
import { deckRarityChances, deckUpgradeCost } from "@/engine";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { useCountUp } from "@/ui/hooks/useCountUp";
import s from "./DeckUpgradeOverlay.module.css";

const FILL_MS = 720;
const BURST_MS = 900;
const SETTLE_MS = 420;

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
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

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

  const levelLabel = showLevelTransition && snapshot ? snapshot.level : view.level;
  const pulseFull = phase === "filling" && snapshot != null && snapshot.exp >= (snapshot.upgradeCost ?? 0);
  const phaseClass = phase === "settle" && settleReady ? s["is-settle-ready"] : undefined;

  return (
    <div
      className={cx(s["upg-overlay"], s[`is-${phase}`], phaseClass)}
      role="dialog"
      aria-modal="true"
      aria-label="卡组升级"
      style={{ "--exp-pct": displayPct, "--fill-ms": `${fillMs}ms` } as CSSProperties}
    >
      <button className={s["upg-backdrop"]} type="button" aria-label="关闭卡组升级" onClick={() => !busy && onClose()} />
      <section className={s["upg-modal"]}>
        <header className={s["upg-head"]}>
          <div>
            <span className={s["upg-kicker"]}>DECK LEVEL / UPGRADE</span>
            <h2 className={s["upg-title"]}>卡组升级</h2>
            <p className={s["upg-sub"]}>提升稀有度抽取权重，重新校准个人卡组的成长轨道。</p>
          </div>
          <button className={s["upg-close"]} type="button" onClick={() => !busy && onClose()} aria-label="关闭">
            ×
          </button>
        </header>

        <div className={s["upg-level-block"]}>
          <div className={s["upg-burst"]} aria-hidden="true">
            <span className={s["upg-ring"]} />
          </div>
          <div className={s["upg-levels"]}>
            {showLevelTransition ? (
              <>
                <strong className={s["upg-level-current"]}>Lv.{levelLabel}</strong>
                <span className={s["upg-level-arrow"]}>→</span>
                <strong className={s["upg-level-target"]}>Lv.{snapshot ? snapshot.level + 1 : view.level + 1}</strong>
              </>
            ) : (
              <strong className={s["upg-level-current"]}>Lv.{view.level}</strong>
            )}
          </div>
          {!showLevelTransition && !showNextChance && <span className={s["upg-cap"]}>已达上限</span>}
        </div>

        <div className={s["upg-metrics"]}>
          <div className={s["upg-metric"]}>
            <span>卡组最低数</span>
            <strong>{view.minDeckSize} 张</strong>
            <small>当前卡组 {view.deckSize} 张</small>
          </div>
          <div className={s["upg-metric"]}>
            <span>升级所需经验</span>
            <strong>{view.upgradeCost == null ? "—" : `${view.upgradeCost}`}</strong>
            <small>{view.upgradeCost == null ? "当前等级无需继续升级" : "下一次升级成本"}</small>
          </div>
          <div className={s["upg-metric"]}>
            <span>当前经验</span>
            <strong>{view.exp}</strong>
            <small>可用于卡组锻造</small>
          </div>
        </div>

        <div className={s["upg-exp"]}>
          <div className={s["upg-exp-head"]}>
            <span>本级升级进度</span>
            <strong>
              {shownExp} / {view.upgradeCost == null ? "MAX" : view.upgradeCost}
            </strong>
          </div>
          <div className={s["upg-exp-track"]}>
            <div className={cx(s["upg-exp-fill"], pulseFull && s["is-pulse"])} />
            <span className={s["upg-exp-glint"]} aria-hidden="true" />
          </div>
        </div>

        <div className={s["upg-probability"]}>
          <div className={s["upg-table-head"]}>
            <span>稀有度抽取概率</span>
            <div>
              <strong>Lv.{view.level}</strong>
              {nextChances && <strong>Lv.{view.level + 1}</strong>}
            </div>
          </div>
          <div className={s["upg-table"]}>
            {RARITIES.map(({ id, label }) => {
              const available = view.hasPool[id];
              const current = currentChances[id];
              const next = nextChances?.[id];
              const delta = next == null ? 0 : next - current;
              return (
                <div className={cx(s["upg-row"], !available && s["is-empty"], delta !== 0 && available && s["is-changed"])} key={id}>
                  <span className={s["upg-rarity"]}>{label}</span>
                  <strong>{available ? percentage(current) : "暂无卡池"}</strong>
                  {nextChances && (
                    <>
                      <span className={s["upg-row-arrow"]}>→</span>
                      <strong>{available ? percentage(next ?? 0) : "—"}</strong>
                      <em>{available ? `${delta >= 0 ? "+" : ""}${percentage(delta)}` : "—"}</em>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <footer className={s["upg-foot"]}>
          <span>{busy ? "系统正在重校准卡组等级……" : canUpgrade ? "升级后可继续查看新的概率曲线。" : "经验不足，仍可查看当前等级的抽取概率。"}</span>
          <button className={s["upg-button"]} type="button" disabled={!canUpgrade || busy} onClick={confirmUpgrade}>
            {busy ? "升级中" : "确定升级"}
          </button>
        </footer>
      </section>
    </div>
  );
}
