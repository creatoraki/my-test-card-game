// Zustand store: 包裹纯 TS 引擎, 供 UI 订阅与派发。
// 每次操作都对战斗状态做一次 structuredClone 再修改, 保证引擎不改动 React 当前持有的对象。
// 出牌/结束回合会连带触发敌人行动, 引擎把每次敌人行动记录成动画帧(frames);
// store 不立即替换终态, 而是把 { frames, final } 交给 UI 逐帧回放(见 commit)。

import { create } from "zustand";
import type {
  AnimFrame,
  BattleSetup,
  BattleState,
  DiscardTriggerFx,
  EncounterModifier,
  PlayRecorder,
} from "../engine";
import type { BondDef, BondTier } from "../data";
import { createBattle, discardHandCard, endRound, playCard, redrawHandCard } from "../engine";

// 一次出牌的动画计划: 先展示出牌结果(cardSnapshot), 再逐帧播放触发的敌人行动, 最后落到 final。
export interface PlayPlan {
  cardSnapshot: BattleState;
  discardTriggers: DiscardTriggerFx[];
  frames: AnimFrame[];
  final: BattleState;
}

export interface DiscardPlan {
  final: BattleState;
  triggers: DiscardTriggerFx[];
}

// 一次结束回合的动画计划: 逐帧播放冲刷的敌人行动, 最后落到 final(下一回合起始态)。
export interface EndPlan {
  frames: AnimFrame[];
  final: BattleState;
}

export interface BattleBondView {
  def: BondDef;
  count: number;
  tier: BondTier | null;
  next: BondTier | null;
}

export interface BattleMeta {
  bonds: BattleBondView[];
}

interface BattleStore {
  battle: BattleState | null;
  meta: BattleMeta | null;
  // 建局计数。UI 用它作为「这是第几场战斗」的身份标识来重置分镜/手牌渲染状态 ——
  // battle 对象每次 commit 都会换新, 不能当身份用; encounterId 又可能在一趟远征里重复。
  seq: number;
  init: (
    encounterId: string,
    setup: BattleSetup,
    seed?: number,
    mod?: EncounterModifier,
    meta?: BattleMeta,
  ) => void;
  play: (uid: string, targetId?: string) => PlayPlan | null;
  redrawCard: (uid: string) => BattleState | null;
  discardCard: (uid: string) => DiscardPlan | null;
  end: () => EndPlan | null;
  commit: (snapshot: BattleState) => void;
  clear: () => void;
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  battle: null,
  meta: null,
  seq: 0,

  init: (encounterId, setup, seed, mod, meta) => {
    set({ battle: createBattle(encounterId, setup, seed, mod), meta: meta ?? null, seq: get().seq + 1 });
  },

  play: (uid, targetId) => {
    const b = get().battle;
    if (!b || b.phase !== "player") return null;
    const draft = structuredClone(b);
    const rec: PlayRecorder = { frames: [], discardTriggers: [] };
    const ok = playCard(draft, uid, targetId, rec);
    if (!ok) return null;
    return {
      cardSnapshot: rec.cardSnapshot ?? draft,
      discardTriggers: rec.discardTriggers,
      frames: rec.frames,
      final: draft,
    };
  },

  redrawCard: (uid) => {
    const b = get().battle;
    if (!b) return null;
    const draft = structuredClone(b);
    return redrawHandCard(draft, uid) ? draft : null;
  },

  discardCard: (uid) => {
    const b = get().battle;
    if (!b) return null;
    const draft = structuredClone(b);
    const triggers: DiscardTriggerFx[] = [];
    return discardHandCard(draft, uid, { triggers }) ? { final: draft, triggers } : null;
  },

  end: () => {
    const b = get().battle;
    if (!b || b.phase !== "player") return null;
    const draft = structuredClone(b);
    const frames: AnimFrame[] = [];
    endRound(draft, frames);
    return { frames, final: draft };
  },

  // 逐帧提交: 每个快照都是独立对象, 直接 set 即可(仍是克隆式不可变更新)。
  commit: (snapshot) => set({ battle: snapshot }),

  clear: () => set({ battle: null, meta: null }),
}));
