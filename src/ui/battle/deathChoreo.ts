import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import type { BattleState } from "@/engine";

export type DeathPhase = "alive" | "drain" | "vanish" | "dead";

export const DEATH = {
  // HpBar.module.css 的 .hp-ghost 是 0.3s 延迟 + 0.5s 收缩, 共 800ms; 这里多留 20ms。
  drain: 820,
  vanish: 700,
  reducedDrain: 160,
  reducedVanish: 0,
} as const;

interface DeathGateOptions {
  seq: number;
  rateRef: MutableRefObject<number>;
}

type DeathTimers = [number, number];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 延后死亡外观的纯 UI 闸门。引擎快照仍是唯一战斗真相, 这里不修改 BattleState。
 * 闸门定时器只按播放倍速折算; 顿帧/slowmo 只有 70~140ms, 不值得为它再造一条时间线。
 */
export function useDeathGate(
  battle: BattleState | null,
  { seq, rateRef }: DeathGateOptions,
): {
  phaseOf: (id: string) => DeathPhase;
  pending: boolean;
  setImpactOffset: (ms: number) => void;
} {
  const phasesRef = useRef(new Map<string, DeathPhase>());
  const timersRef = useRef(new Map<string, DeathTimers>());
  const impactOffsetRef = useRef(0);
  const [, redraw] = useState(0);

  const clearUnit = useCallback((id: string) => {
    const timers = timersRef.current.get(id);
    if (timers) {
      window.clearTimeout(timers[0]);
      window.clearTimeout(timers[1]);
      timersRef.current.delete(id);
    }
    phasesRef.current.delete(id);
  }, []);

  const clearAll = useCallback(() => {
    let changed = phasesRef.current.size > 0 || timersRef.current.size > 0;
    for (const [id, timers] of timersRef.current) {
      window.clearTimeout(timers[0]);
      window.clearTimeout(timers[1]);
      timersRef.current.delete(id);
    }
    phasesRef.current.clear();
    if (changed) redraw((version) => version + 1);
  }, []);

  const phaseOf = useCallback((id: string): DeathPhase => phasesRef.current.get(id) ?? "alive", []);

  const setImpactOffset = useCallback((ms: number) => {
    impactOffsetRef.current = Math.max(0, ms);
  }, []);

  // battleSeq 是战斗身份边界。换局和卸载都必须撤销上一局的死亡定时器。
  useEffect(() => {
    clearAll();
    impactOffsetRef.current = 0;
    return clearAll;
  }, [clearAll, seq]);

  useEffect(() => {
    if (!battle) {
      impactOffsetRef.current = 0;
      clearAll();
      return;
    }

    const reduced = prefersReducedMotion();
    const drain = reduced ? DEATH.reducedDrain : DEATH.drain;
    const vanish = reduced ? DEATH.reducedVanish : DEATH.vanish;
    // reduced-motion 下居合斩本身不播长动画, 不应保留等待 impactMs 的空档。
    const impactOffset = reduced ? 0 : impactOffsetRef.current;
    impactOffsetRef.current = 0;
    const rate = Math.max(0.25, rateRef.current);
    let changed = false;

    for (const cmb of Object.values(battle.combatants)) {
      const current = phasesRef.current.get(cmb.id);
      if (cmb.alive) {
        if (current) {
          clearUnit(cmb.id);
          changed = true;
        }
        continue;
      }
      if (current) continue;

      phasesRef.current.set(cmb.id, "drain");
      changed = true;
      const vanishTimer = window.setTimeout(() => {
        if (phasesRef.current.get(cmb.id) !== "drain") return;
        phasesRef.current.set(cmb.id, "vanish");
        redraw((version) => version + 1);
      }, (impactOffset + drain) / rate);
      const deadTimer = window.setTimeout(() => {
        if (phasesRef.current.get(cmb.id) !== "vanish") return;
        phasesRef.current.set(cmb.id, "dead");
        timersRef.current.delete(cmb.id);
        redraw((version) => version + 1);
      }, (impactOffset + drain + vanish) / rate);
      timersRef.current.set(cmb.id, [vanishTimer, deadTimer]);
    }

    if (changed) redraw((version) => version + 1);
  }, [battle, clearAll, clearUnit, rateRef, seq]);

  let pending = false;
  if (battle) {
    // 先看快照本身, 避免 commit(won/lost) 后、内部 effect 扫描前的同帧结算竞态。
    for (const cmb of Object.values(battle.combatants)) {
      if (!cmb.alive && phasesRef.current.get(cmb.id) !== "dead") {
        pending = true;
        break;
      }
    }
  }
  if (!pending) {
    for (const phase of phasesRef.current.values()) {
      if (phase === "drain" || phase === "vanish") {
        pending = true;
        break;
      }
    }
  }

  return { phaseOf, pending, setImpactOffset };
}