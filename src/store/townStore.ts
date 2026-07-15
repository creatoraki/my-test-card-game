// Zustand store: 城镇档案 —— 跨远征持久的玩家资产(角色养成 / 编队 / 个人卡组)。
// 与 runStore 的分工: 这里存"永久拥有的东西", runStore 只存"这趟远征的进度"。
// 依赖方向: runStore → townStore(单向); 本 store 不认识 runStore。
// 已接 persist 中间件(localStorage), 刷新页面进度保留;「重置存档」清回初始档。

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Card } from "../engine";
import { RULES, expToNext } from "../engine";
import { CHARACTERS, getCharacter, makeCard, type CharacterDef } from "../data";

// 四维属性的已分配点数(存点数不存换算值, 换算统一走 deriveStats)
export interface CharacterAttrs {
  hp: number;
  attack: number;
  defense: number;
  threat: number;
}

export interface CharacterState {
  charId: string;
  level: number; // 从 1 起
  exp: number; // 当前等级内已积累的经验
  attrPoints: number; // 未分配属性点(升级 +5, 加点/抽卡消耗)
  attrs: CharacterAttrs;
  deck: Card[]; // 个人卡组(实例); 战斗卡组 = 上阵角色个人卡组的集合
  pendingDraw: string[] | null; // 抽卡进行中的候选 defId; 持久化 => 刷新也躲不掉 3 选 1
}

// 战后经验结算报告条目(交给结算/胜利界面展示)
export interface ExpGain {
  charId: string;
  gained: number;
  fromLevel: number;
  toLevel: number;
  pointsGained: number;
  expAfter: number; // 结算后当前等级内经验
  expToNextAfter: number; // 结算后升下一级所需(供进度条)
}

interface TownStore {
  characters: Record<string, CharacterState>;
  party: string[]; // 上阵角色 id, 1 ≤ length ≤ RULES.progression.partySize
  initialized: boolean;

  ensureProfile: () => void; // 幂等: 首次进城镇时建档
  resetProfile: () => void; // 重置存档
  allocatePoint: (charId: string, attr: keyof CharacterAttrs) => void; // 花 1 点加一项属性
  startDraw: (charId: string) => void; // 花 drawCost 点 → 随机 drawChoices 张候选
  pickDraw: (charId: string, cardDefId: string) => void; // 3 选 1 落袋, 清 pendingDraw
  toggleParty: (charId: string) => void; // 上阵/下阵
  grantExp: (charIds: string[], amount: number) => ExpGain[]; // 发经验并处理连升
}

// 角色最终战斗数值 = 基础值 + 已分配点数 × 每点收益(唯一换算点, UI 与开战共用)
export function deriveStats(cs: CharacterState): {
  maxHp: number;
  attack: number;
  defense: number;
  threat: number;
} {
  const base = getCharacter(cs.charId);
  const p = RULES.progression;
  return {
    maxHp: base.maxHp + cs.attrs.hp * p.hpPerPoint,
    attack: cs.attrs.attack * p.attackPerPoint,
    defense: cs.attrs.defense * p.defensePerPoint,
    threat: base.threat + cs.attrs.threat * p.threatPerPoint,
  };
}

function freshCharacter(def: CharacterDef): CharacterState {
  return {
    charId: def.id,
    level: 1,
    exp: 0,
    attrPoints: 0,
    attrs: { hp: 0, attack: 0, defense: 0, threat: 0 },
    deck: def.startingCardIds.map((cid) => makeCard(cid)),
    pendingDraw: null,
  };
}

function freshProfile(): { characters: Record<string, CharacterState>; party: string[] } {
  const characters: Record<string, CharacterState> = {};
  for (const c of CHARACTERS) characters[c.id] = freshCharacter(c);
  const party = CHARACTERS.slice(0, RULES.progression.partySize).map((c) => c.id);
  return { characters, party };
}

export const useTownStore = create<TownStore>()(
  persist(
    (set, get) => ({
      characters: {},
      party: [],
      initialized: false,

      ensureProfile: () => {
        if (get().initialized) return;
        set({ ...freshProfile(), initialized: true });
      },

      resetProfile: () => set({ ...freshProfile(), initialized: true }),

      allocatePoint: (charId, attr) => {
        const cs = get().characters[charId];
        if (!cs || cs.attrPoints < 1) return;
        set({
          characters: {
            ...get().characters,
            [charId]: {
              ...cs,
              attrPoints: cs.attrPoints - 1,
              attrs: { ...cs.attrs, [attr]: cs.attrs[attr] + 1 },
            },
          },
        });
      },

      startDraw: (charId) => {
        const cs = get().characters[charId];
        const p = RULES.progression;
        if (!cs || cs.pendingDraw || cs.attrPoints < p.drawCost) return;
        const pool = getCharacter(charId).poolCardIds;
        if (!pool.length) return;
        // 候选独立随机, 允许重复 —— 抽到两张同名卡也是合法结果
        const options = Array.from(
          { length: p.drawChoices },
          () => pool[Math.floor(Math.random() * pool.length)],
        );
        set({
          characters: {
            ...get().characters,
            [charId]: { ...cs, attrPoints: cs.attrPoints - p.drawCost, pendingDraw: options },
          },
        });
      },

      pickDraw: (charId, cardDefId) => {
        const cs = get().characters[charId];
        if (!cs?.pendingDraw?.includes(cardDefId)) return;
        set({
          characters: {
            ...get().characters,
            [charId]: { ...cs, deck: [...cs.deck, makeCard(cardDefId)], pendingDraw: null },
          },
        });
      },

      toggleParty: (charId) => {
        const { party, characters } = get();
        if (!characters[charId]) return;
        if (party.includes(charId)) {
          if (party.length <= 1) return; // 至少保留 1 人上阵
          set({ party: party.filter((id) => id !== charId) });
        } else {
          if (party.length >= RULES.progression.partySize) return;
          set({ party: [...party, charId] });
        }
      },

      grantExp: (charIds, amount) => {
        const characters = { ...get().characters };
        const report: ExpGain[] = [];
        for (const id of charIds) {
          const cs = characters[id];
          if (!cs) continue;
          let { level, exp, attrPoints } = cs;
          const fromLevel = level;
          exp += amount;
          while (exp >= expToNext(level)) {
            exp -= expToNext(level);
            level += 1;
            attrPoints += RULES.progression.levelUpPoints;
          }
          characters[id] = { ...cs, level, exp, attrPoints };
          report.push({
            charId: id,
            gained: amount,
            fromLevel,
            toLevel: level,
            pointsGained: (level - fromLevel) * RULES.progression.levelUpPoints,
            expAfter: exp,
            expToNextAfter: expToNext(level),
          });
        }
        set({ characters });
        return report;
      },
    }),
    { name: "town-profile-v1", version: 1 },
  ),
);
