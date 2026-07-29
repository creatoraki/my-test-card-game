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
  // ★ 已唤醒(已解锁)的角色 id, 按唤醒先后。CHARACTERS 里不在这张名单上的都还躺在冬眠仓里。
  // ⚠ characters 仍是**全量**建档(见 freshProfile) —— 「有没有解锁」只看这里, 各处取
  //   characters[id] 才不必判空。上阵资格 = 在这张名单上。
  awakened: string[];
  party: string[]; // 上阵角色 id, 1 ≤ length ≤ RULES.progression.partySize, 且必须 ⊆ awakened
  loot: number; // 残片余额 —— 探索层的产出, 仅撤退/通关时落袋进来(团灭全丢)
  initialized: boolean;

  ensureProfile: () => void; // 幂等: 首次进城镇时建档
  bankLoot: (amount: number) => void; // 远征结束落袋
  resetProfile: () => void; // 重置存档
  allocatePoint: (charId: string, attr: keyof CharacterAttrs) => void; // 花 1 点加一项属性
  startDraw: (charId: string) => void; // 花 drawCost 点 → 随机 drawChoices 张候选
  pickDraw: (charId: string, cardDefId: string) => void; // 3 选 1 落袋, 清 pendingDraw
  toggleParty: (charId: string) => void; // 上阵/下阵
  awaken: (charId: string) => void; // 冬眠仓: 花 awakenCost 残片解封一名休眠队员
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

// ★ 开局只有第一名角色是醒着的(主角), 其余全躺在冬眠仓等着被解封。
//   characters 仍然**全量**建档 —— 未唤醒角色也有一份初始档案, 解封那一刻直接可用,
//   awaken() 不需要建档, 各处 characters[id] 也不必判空。
function freshProfile(): {
  characters: Record<string, CharacterState>;
  awakened: string[];
  party: string[];
} {
  const characters: Record<string, CharacterState> = {};
  for (const c of CHARACTERS) characters[c.id] = freshCharacter(c);
  const awakened = CHARACTERS.slice(0, 1).map((c) => c.id);
  return { characters, awakened, party: [...awakened] };
}

export const useTownStore = create<TownStore>()(
  persist(
    (set, get) => ({
      characters: {},
      awakened: [],
      party: [],
      loot: 0,
      initialized: false,

      ensureProfile: () => {
        if (get().initialized) return;
        set({ ...freshProfile(), loot: 0, initialized: true });
      },

      resetProfile: () => set({ ...freshProfile(), loot: 0, initialized: true }),

      bankLoot: (amount) => {
        if (amount <= 0) return;
        set({ loot: get().loot + amount });
      },

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
        const { party, characters, awakened } = get();
        if (!characters[charId]) return;
        if (party.includes(charId)) {
          if (party.length <= 1) return; // 至少保留 1 人上阵
          set({ party: party.filter((id) => id !== charId) });
        } else {
          if (!awakened.includes(charId)) return; // 还在冬眠仓里的人上不了阵
          if (party.length >= RULES.progression.partySize) return;
          set({ party: [...party, charId] });
        }
      },

      // 冬眠仓解封: 扣残片 + 进 awakened 名单。
      // ⚠ 刻意**不自动上阵** —— 队伍可能已经满员, 自动塞人要么失败要么得替谁下阵,
      //   两种都不该由 store 替玩家决定。解封后由玩家在冬眠仓里手动编队。
      awaken: (charId) => {
        const { characters, awakened, loot } = get();
        const cost = RULES.progression.awakenCost;
        if (!characters[charId] || awakened.includes(charId) || loot < cost) return;
        set({ awakened: [...awakened, charId], loot: loot - cost });
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
    // ⚠ 加 awakened 时把 key 从 v1 提到 v2: 旧档没有这个字段, 读进来会让整个冬眠仓名单为
    //   undefined。项目不做旧存档兼容, 换 key 让旧档自然失效重建, 比写 migrate 省事。
    { name: "town-profile-v2", version: 2 },
  ),
);
