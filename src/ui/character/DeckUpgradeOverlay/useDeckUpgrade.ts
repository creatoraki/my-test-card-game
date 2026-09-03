import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Rarity } from "@/engine";
import { deckRarityChances, deckUpgradeCost } from "@/engine";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { useHoldCharge, type UseHoldChargeResult } from "@/ui/hooks/useHoldCharge";
import s from "./DeckUpgradeOverlay.module.css";

const FILL_MS = 720;
const BURST_MS = 900;
const SETTLE_MS = 420;
const CHARGE_MS = 700;

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

export interface UseDeckUpgradeOptions extends PanelView {
  levelMax: number;
  canUpgrade: boolean;
  onConfirm: () => void;
}

export interface DeckUpgradeState {
  view: PanelView;
  levelMax: number;
  phase: Phase;
  busy: boolean;
  canUpgrade: boolean;
  settleReady: boolean;
  shownExp: number;
  displayPct: number;
  fillMs: number;
  currentChances: Record<Rarity, number>;
  nextChances: Record<Rarity, number> | null;
  pulseFull: boolean;
  badgeLevel: number;
  badgeTargetLevel: number;
  showLevelTransition: boolean;
  chargeProgress: number;
  holding: boolean;
  chargeReady: boolean;
  statusLabel: string;
  holdBind: UseHoldChargeResult["bind"];
  rootClassName: string;
  rootStyle: CSSProperties;
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

export function useDeckUpgrade({
  level,
  exp,
  upgradeCost,
  nextUpgradeCost,
  deckSize,
  minDeckSize,
  hasPool,
  levelMax,
  canUpgrade,
  onConfirm,
}: UseDeckUpgradeOptions): DeckUpgradeState {
  const [phase, setPhase] = useState<Phase>("idle");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [settlePct, setSettlePct] = useState(0);
  const [settleReady, setSettleReady] = useState(false);
  const snapshotRef = useRef<Snapshot | null>(null);
  const runIdRef = useRef(0);
  const busy = phase !== "idle";

  const currentView: PanelView = {
    level,
    exp,
    upgradeCost,
    nextUpgradeCost,
    deckSize,
    minDeckSize,
    hasPool,
  };
  const view = phase === "levelup" || phase === "settle"
    ? snapshot
      ? targetView(snapshot)
      : currentView
    : phase === "filling" && snapshot
      ? snapshot
      : currentView;
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

  return {
    view,
    levelMax,
    phase,
    busy,
    canUpgrade,
    settleReady,
    shownExp,
    displayPct,
    fillMs,
    currentChances,
    nextChances,
    pulseFull,
    badgeLevel,
    badgeTargetLevel,
    showLevelTransition,
    chargeProgress,
    holding,
    chargeReady,
    statusLabel,
    holdBind,
    rootClassName: cx(
      s["upg-overlay"],
      s[`is-${phase}`],
      phaseClass,
      holding && s["is-holding"],
      chargeReady && s["is-charge-ready"],
    ),
    rootStyle: {
      "--exp-pct": displayPct,
      "--fill-ms": `${fillMs}ms`,
      "--charge": chargeProgress,
      "--charge-pct": chargePct,
    } as CSSProperties,
  };
}
