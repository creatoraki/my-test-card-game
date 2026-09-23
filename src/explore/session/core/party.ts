// 队伍快照的增减 —— 回血、掉血、换装同步、团灭与战斗回填。

import { EXPLORE_RULES } from "../../core/exploreRules";
import type { ExploreState } from "../../types";
import { logLine } from "./log";

// 换装后同步队伍快照。★ 只裁不补(产品口径): 装备变强不回血, 变弱也不会把人打死。
//   hpLimit 是"当前可治疗上限"= 生命上限减去永久损伤, 故随上限增减同步平移, 损伤本身保留。
export function syncPartyVitals(
  s: ExploreState,
  charId: string,
  maxHp: number,
  burdenAdapt: number,
): boolean {
  const member = s.party.find((p) => p.charId === charId);
  if (!member) return false;
  const nextMax = Math.max(1, Math.round(maxHp));
  const delta = nextMax - member.maxHp;
  member.maxHp = nextMax;
  member.hpLimit = Math.max(1, Math.min(nextMax, member.hpLimit + delta));
  const floor = member.alive && member.hp > 0 ? 1 : 0;
  member.hp = Math.max(floor, Math.min(member.hp, member.hpLimit));
  // 负重适应也随装备变 —— 探索页的负重读数与开战快照都读它(见 partyBurdenAdapt)。
  member.burdenAdapt = burdenAdapt;
  return true;
}

export function healParty(s: ExploreState, percent: number): void {
  for (const p of s.party) {
    if (!p.alive) continue; // 回血不复活阵亡者
    p.hp = Math.min(p.hpLimit, p.hp + Math.ceil(p.maxHp * percent));
  }
}

export function damagePartyPercent(s: ExploreState, percent: number): void {
  for (const p of s.party) {
    if (!p.alive) continue;
    const damage = Math.max(1, Math.round(p.maxHp * percent));
    p.hpLimit = Math.max(1, p.hpLimit > p.hp ? p.hp : p.hpLimit);
    p.hp -= damage;
    if (p.hp <= 0) {
      p.hp = 0;
      p.alive = false;
      logLine(s, `${p.name} 倒下了`);
    }
  }
}

// 全队阵亡 = 团灭。事件掉血也可能触发, 故每次改动队伍后都要查。返回是否刚刚团灭。
export function checkWipe(s: ExploreState): boolean {
  if (s.phase === "wiped" || s.phase === "cleared" || s.phase === "retreated") return false;
  if (!s.party.every((p) => !p.alive)) return false;
  s.phase = "wiped";
  loseEverything(s);
  logLine(s, "全队失去意识……");
  return true;
}

// 团灭惩罚的唯一真相点: 积分与背包全丢, 已寄回的(s.shipped)不受影响(设计文档 §3.2 / §6.5)。
// ★ 显式清空而不是「靠没人来入库」隐式实现 —— 后者会让 UI 在结算前还读得到一包早就没了的东西。
export function loseEverything(s: ExploreState): void {
  s.loot = Math.floor(s.loot * EXPLORE_RULES.wipe.lootKept);
  if (s.backpack.length || s.pendingPickup.length || s.pendingLoot.length) {
    logLine(s, "背包连同里面的东西一起丢在了那层楼");
  }
  s.backpack = [];
  s.pendingPickup = [];
  s.pendingLoot = [];
  s.pendingBoons = [];
  s.pendingCardOffer = null;
  s.pendingExp = {};
  s.pendingActions = [];
  s.chuteOpen = false;
}

export type BattleSurvivor = {
  charId: string;
  hp: number;
  hpLimit?: number;
  alive: boolean;
  limitLoss: number;
};

// 血量跨战斗继承 —— 这是整套设计的地基。
// ★ 唯一真相点: 战斗正常结算(finishBattle)与战斗中主动撤离(retreatFromBattle)共用这一段,
//   两处各写一份迟早对不上。
export function applySurvivors(s: ExploreState, survivors: BattleSurvivor[]): void {
  for (const p of s.party) {
    const found = survivors.find((x) => x.charId === p.charId);
    if (!found) continue;
    p.hpLimit = Math.max(1, Math.min(p.maxHp, p.hpLimit - Math.max(0, Math.round(found.limitLoss))));
    p.hp = Math.max(0, Math.min(p.hpLimit, Math.round(found.hp)));
    p.alive = found.alive;
  }
}

// 取出本趟新阵亡且尚未结算装备的成员 id, 并就地打上 gearSettled 标记。
export function takeUnsettledFallen(s: ExploreState): string[] {
  const fallen: string[] = [];
  for (const member of s.party) {
    if (member.alive || member.gearSettled) continue;
    member.gearSettled = true;
    fallen.push(member.charId);
  }
  return fallen;
}
