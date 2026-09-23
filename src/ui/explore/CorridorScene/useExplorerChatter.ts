import { useCallback, useEffect, useRef } from "react";
import { EXPLORER_LINES, type ExplorerLineKind } from "@/data";
import { energyTier, backpackSlots } from "@/explore/session";
import type { PortalDir } from "@/explore/dungeon/types";
import { RULES } from "@/engine";
import { useExploreStore } from "@/store/explore/exploreStore";
import { useBotChatter, type ChatLine } from "@/ui/common/widget/ChatBot";

const EXPLORER_IDLE_RANGE = [10000, 16000] as const;
const WALK_MIN_MS = 10000;
const WALK_MAX_MS = 16000;
const BUBBLE_MS = 3000;
/** 所有台词共用的冷却：从上一句开始计时，10 秒内不再开口(显示 3 秒 + 静默 7 秒)。 */
const SPEECH_CD_MS = 10000;
const LOW_ENERGY_MAX = 40;
const BURDEN_WARN_AT = 0.8;

/*
 * 冷却时间戳放在模块作用域而不是 useRef：CorridorScene 带 key={roomId}，
 * 换房间会整体重挂，用 ref 会让 CD 在每次换房时清零，到达台词可能紧贴上一句蹦出来。
 */
let lastSpokeAt = Number.NEGATIVE_INFINITY;

interface ExplorerChatterInput {
  walking: boolean;
  nearbyKey: string;
  portalDir: PortalDir | null;
  nearGate: boolean;
  blocked: boolean;
  activeObjectId: string | null;
}

const randomDelay = (min: number, max: number) => min + Math.random() * (max - min);

/** 探索场景的玩家独白调度：离散场景信号统一经过冷却闸门，冷却中触发的台词直接丢弃。 */
export function useExplorerChatter({
  walking,
  nearbyKey,
  portalDir,
  nearGate,
  blocked,
  activeObjectId,
}: ExplorerChatterInput): { line: ChatLine | null } {
  // 只订阅基础类型：行走中的暗雷检定等提交不改这两个值时，场景不跟着重渲染。
  const energy = useExploreStore((state) => state.session?.energy ?? 100);
  const energyLevel = energyTier(energy);
  const occupied = useExploreStore((state) => state.session ? backpackSlots(state.session) : 0);
  const capacity = RULES.burden.backpackSlots;
  const burdenFill = capacity > 0 ? occupied / capacity : 0;

  const blockedRef = useRef(blocked);
  const walkingRef = useRef(walking);
  const sayRef = useRef<(kind: ExplorerLineKind) => void>(() => {});
  const trySayRef = useRef<(kind: ExplorerLineKind) => boolean>(() => false);
  blockedRef.current = blocked;
  walkingRef.current = walking;

  const onIdle = useCallback(() => {
    if (!blockedRef.current && !walkingRef.current) trySayRef.current("idle");
  }, []);
  const chatter = useBotChatter<ExplorerLineKind>(true, {
    lines: EXPLORER_LINES,
    greet: "arrive",
    greetEnabled: false,
    idle: "idle",
    idleEnabled: !walking && !blocked,
    idleRange: EXPLORER_IDLE_RANGE,
    bubbleMs: BUBBLE_MS,
    onIdle,
  });
  sayRef.current = chatter.say;

  const trySay = useCallback((kind: ExplorerLineKind): boolean => {
    if (blockedRef.current) return false;
    const now = Date.now();
    if (now - lastSpokeAt < SPEECH_CD_MS) return false;
    lastSpokeAt = now;
    sayRef.current(kind);
    return true;
  }, []);
  trySayRef.current = trySay;

  const walkTimerRef = useRef(0);
  const clearWalkTimer = useCallback(() => {
    window.clearTimeout(walkTimerRef.current);
  }, []);
  const scheduleWalk = useCallback(() => {
    clearWalkTimer();
    if (!walking || blocked) return;
    walkTimerRef.current = window.setTimeout(() => {
      if (!blockedRef.current && walkingRef.current) trySayRef.current("walk");
      if (!blockedRef.current && walkingRef.current) scheduleWalk();
    }, randomDelay(WALK_MIN_MS, WALK_MAX_MS));
  }, [blocked, clearWalkTimer, walking]);

  useEffect(() => {
    if (blocked) chatter.clear();
  }, [blocked, chatter.clear]);

  useEffect(() => {
    if (blocked) {
      clearWalkTimer();
      return;
    }
    scheduleWalk();
    return clearWalkTimer;
  }, [blocked, clearWalkTimer, scheduleWalk]);

  const arrivedRef = useRef(false);
  useEffect(() => {
    if (blocked || arrivedRef.current) return;
    arrivedRef.current = true;
    trySay("arrive");
  }, [blocked, trySay]);

  const seenCurioIdsRef = useRef(new Set<string>());
  useEffect(() => {
    if (blocked) return;
    for (const id of nearbyKey.split("|").filter(Boolean)) {
      if (seenCurioIdsRef.current.has(id)) continue;
      seenCurioIdsRef.current.add(id);
      trySay("curio");
      break;
    }
  }, [blocked, nearbyKey, trySay]);

  const seenPortalDirsRef = useRef(new Set<PortalDir>());
  const previousPortalDirRef = useRef(portalDir);
  useEffect(() => {
    const previous = previousPortalDirRef.current;
    if (!blocked && !previous && portalDir && !seenPortalDirsRef.current.has(portalDir)) {
      seenPortalDirsRef.current.add(portalDir);
      trySay("portal");
    }
    previousPortalDirRef.current = portalDir;
  }, [blocked, portalDir, trySay]);

  const previousNearGateRef = useRef(nearGate);
  useEffect(() => {
    if (!blocked && !previousNearGateRef.current && nearGate) trySay("bossGate");
    previousNearGateRef.current = nearGate;
  }, [blocked, nearGate, trySay]);

  const previousActiveObjectRef = useRef(activeObjectId);
  useEffect(() => {
    if (!blocked && previousActiveObjectRef.current && !activeObjectId) {
      trySay("afterCurio");
    }
    previousActiveObjectRef.current = activeObjectId;
  }, [activeObjectId, blocked, trySay]);

  const previousEnergyTierRef = useRef(energyLevel.tier);
  const spokenEnergyTiersRef = useRef(new Set<number>());
  useEffect(() => {
    const previous = previousEnergyTierRef.current;
    if (
      !blocked
      && energy < LOW_ENERGY_MAX
      && energyLevel.tier > previous
      && !spokenEnergyTiersRef.current.has(energyLevel.tier)
    ) {
      spokenEnergyTiersRef.current.add(energyLevel.tier);
      trySay("lowEnergy");
    }
    previousEnergyTierRef.current = energyLevel.tier;
  }, [blocked, energy, energyLevel.tier, trySay]);

  const previousBurdenFillRef = useRef(burdenFill);
  const heavySpokenRef = useRef(false);
  useEffect(() => {
    if (
      !blocked
      && previousBurdenFillRef.current < BURDEN_WARN_AT
      && burdenFill >= BURDEN_WARN_AT
      && !heavySpokenRef.current
    ) {
      heavySpokenRef.current = true;
      trySay("heavy");
    }
    previousBurdenFillRef.current = burdenFill;
  }, [blocked, burdenFill, trySay]);

  return { line: blocked ? null : chatter.line };
}
