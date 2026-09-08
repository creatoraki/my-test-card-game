import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { BattleState, Card } from "@/engine";
import { DISCARD, HAND_DEAL } from "@/ui/battle/animations";

export interface RenderHandEntry {
  card: Card;
  leaving: boolean;
  purged: boolean;
  dealDelay: number;
}

export interface HandRenderApi {
  renderHand: RenderHandEntry[];
  playingOutUid: string | null;
  setPlayingOutUid: Dispatch<SetStateAction<string | null>>;
  discardingUidSet: Set<string>;
  markDiscarding: (uid: string) => void;
  clearDiscarding: () => void;
  onCardExited: (uid: string) => void;
  scheduleAfterDiscard: (fn: () => void) => void;
}

export function useHandRender({ battle, battleSeq }: { battle: BattleState | null; battleSeq: number }): HandRenderApi {
  const [renderHand, setRenderHand] = useState<RenderHandEntry[]>([]);
  const [playingOutUid, setPlayingOutUid] = useState<string | null>(null);
  const [discardingUids, setDiscardingUids] = useState<string[]>([]);
  const discardingUidsRef = useRef(new Set<string>());
  const dealtUidsRef = useRef(new Set<string>());
  const openingDoneRef = useRef(false);
  const vanishedUidsRef = useRef(new Set<string>());
  const discardCommitTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    discardCommitTimersRef.current.forEach((timer) => clearTimeout(timer));
    discardCommitTimersRef.current = [];
  }, []);

  useEffect(() => {
    setRenderHand([]);
    setPlayingOutUid(null);
    setDiscardingUids([]);
    discardingUidsRef.current.clear();
    dealtUidsRef.current.clear();
    openingDoneRef.current = false;
    vanishedUidsRef.current.clear();
    clearTimers();
  }, [battleSeq, clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  // 同步渲染列表 = 引擎手牌 + 离场中的卡。引擎手牌里消失的卡标记 leaving(出鞘渐隐, 保留原位),
  // 新增的卡追加到末尾(挂载即飞入)。leaving 卡在其离场动画结束后由 onCardExited 移除。
  useEffect(() => {
    if (!battle) return;
    const liveSet = new Set(battle.hand);
    for (const uid of vanishedUidsRef.current) {
      if (!liveSet.has(uid)) vanishedUidsRef.current.delete(uid);
    }
    const newUids = battle.hand.filter(
      (uid) => !dealtUidsRef.current.has(uid) && !vanishedUidsRef.current.has(uid),
    );
    const base = openingDoneRef.current ? 0 : HAND_DEAL.opening;
    const delayOf = new Map(newUids.map((uid, index) => [uid, base + index * HAND_DEAL.stagger]));
    if (newUids.length > 0) openingDoneRef.current = true;
    newUids.forEach((uid) => dealtUidsRef.current.add(uid));
    setRenderHand((previous) => {
      const previousUids = new Set(previous.map((entry) => entry.card.uid));
      const merged = previous.map((entry) =>
        liveSet.has(entry.card.uid)
          ? { card: battle.cards[entry.card.uid], leaving: false, purged: false, dealDelay: entry.dealDelay }
          : {
              card: entry.card,
              leaving: true,
              purged: battle.combatants[entry.card.ownerCharId]?.alive === false,
              dealDelay: entry.dealDelay,
            },
      );
      for (const uid of battle.hand) {
        if (!previousUids.has(uid)) {
          merged.push({
            card: battle.cards[uid],
            leaving: false,
            purged: false,
            dealDelay: delayOf.get(uid) ?? 0,
          });
        }
      }
      return merged;
    });
  }, [battle]);

  const onCardExited = useCallback((uid: string) => {
    if (battle?.hand.includes(uid)) vanishedUidsRef.current.add(uid);
    dealtUidsRef.current.delete(uid);
    setRenderHand((previous) => previous.filter((entry) => entry.card.uid !== uid));
    setPlayingOutUid((current) => (current === uid ? null : current));
    discardingUidsRef.current.delete(uid);
    setDiscardingUids((current) => current.filter((id) => id !== uid));
  }, [battle]);

  const markDiscarding = useCallback((uid: string) => {
    if (discardingUidsRef.current.has(uid)) return;
    discardingUidsRef.current.add(uid);
    setDiscardingUids((current) => [...current, uid]);
  }, []);

  const clearDiscarding = useCallback(() => {
    discardingUidsRef.current.clear();
    setDiscardingUids([]);
  }, []);

  const scheduleAfterDiscard = useCallback((fn: () => void) => {
    let timer: ReturnType<typeof setTimeout>;
    timer = setTimeout(() => {
      discardCommitTimersRef.current = discardCommitTimersRef.current.filter((item) => item !== timer);
      fn();
    }, DISCARD.total);
    discardCommitTimersRef.current.push(timer);
  }, []);

  const discardingUidSet = useMemo(() => new Set(discardingUids), [discardingUids]);

  return {
    renderHand,
    playingOutUid,
    setPlayingOutUid,
    discardingUidSet,
    markDiscarding,
    clearDiscarding,
    onCardExited,
    scheduleAfterDiscard,
  };
}
