// Zustand store: 包裹纯 TS 引擎, 供 UI 订阅与派发。
// 每次操作都对战斗状态做一次 structuredClone 再修改, 保证引擎不改动 React 当前持有的对象。
// 出牌/结束回合会连带触发敌人行动, 引擎把每次敌人行动记录成动画帧(frames);
// store 不立即替换终态, 而是把 { frames, final } 交给 UI 逐帧回放(见 commit)。

import { create } from "zustand";
import type { AnimFrame, BattleSetup, BattleState, PlayRecorder } from "../engine";
import { createBattle, endRound, playCard } from "../engine";

// 一次出牌的动画计划: 先展示出牌结果(cardSnapshot), 再逐帧播放触发的敌人行动, 最后落到 final。
export interface PlayPlan {
  cardSnapshot: BattleState;
  frames: AnimFrame[];
  final: BattleState;
}

// 一次结束回合的动画计划: 逐帧播放冲刷的敌人行动, 最后落到 final(下一回合起始态)。
export interface EndPlan {
  frames: AnimFrame[];
  final: BattleState;
}

interface BattleStore {
  battle: BattleState | null;
  init: (encounterId: string, setup: BattleSetup, seed?: number) => void;
  play: (uid: string, targetId?: string) => PlayPlan | null;
  end: () => EndPlan | null;
  commit: (snapshot: BattleState) => void;
  clear: () => void;
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  battle: null,

  init: (encounterId, setup, seed) => {
    set({ battle: createBattle(encounterId, setup, seed) });
  },

  play: (uid, targetId) => {
    const b = get().battle;
    if (!b || b.phase !== "player") return null;
    const draft = structuredClone(b);
    const rec: PlayRecorder = { frames: [] };
    const ok = playCard(draft, uid, targetId, rec);
    if (!ok) return null;
    return { cardSnapshot: rec.cardSnapshot ?? draft, frames: rec.frames, final: draft };
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

  clear: () => set({ battle: null }),
}));
