// ============================================================================
// 属性结算 —— 面板层级的唯一换算点(《角色养成设计.md》第二章)。
//
//   最终属性 =(角色基础值 + 装备固定值)×(1 + 装备百分比) + 战斗内固定修正
//   战斗内百分比最后结算; 概率类属性在最终结算后截断。
//
// 局外那两层(角色基础 + 装备)在进战斗前就已合并进 Combatant.stats;
// 本模块负责把 Combatant.mods(战斗内修正)叠上去, 并提供各处需要的派生量。
// ⚠ 只 import 类型与规则, 不 import 引擎实现 —— ops / effects / statuses 都能安全引用它。
// ============================================================================

import type { BattleState, Combatant, SquadResourceMods, StatBlock, StatModifier } from "./types";
import { OVERLOAD_STATUS_ID, RULES, capProb } from "./rules";
import { STATUS_DEFS } from "./statuses";

// 全零面板。新增属性时只需在 types.StatBlock 与这里各加一行。
export const ZERO_STATS: StatBlock = {
  maxHp: 0,
  attack: 0,
  healPower: 0,
  defense: 0,
  hitRate: 0,
  dodgeRate: 0,
  critRate: 0,
  critDamage: 0,
  precision: 0,
  initiative: 0,
  blockRate: 0,
  healBoost: 0,
  shieldBoost: 0,
  ailmentResist: 0,
  burdenAdapt: 0,
  handLimit: 0,
  drawCount: 0,
};

export const STAT_KEYS = Object.keys(ZERO_STATS) as (keyof StatBlock)[];

// 用局部字段补全成完整面板(未写的项为 0)。角色/装备数据都用它落地。
export function makeStats(partial: Partial<StatBlock>): StatBlock {
  return { ...ZERO_STATS, ...partial };
}

// 逐项相加。用于把多件装备的固定值合进角色基础面板。
export function addStats(...blocks: Partial<StatBlock>[]): StatBlock {
  const out = { ...ZERO_STATS };
  for (const b of blocks) for (const k of STAT_KEYS) out[k] += b[k] ?? 0;
  return out;
}

// 把一层修正(flat + pct)套到面板上: (base + flat) ×(1 + pct/100)。
export function applyModifier(base: StatBlock, mod: StatModifier): StatBlock {
  const out = { ...ZERO_STATS };
  for (const k of STAT_KEYS) {
    const flat = base[k] + (mod.flat?.[k] ?? 0);
    out[k] = flat * (1 + (mod.pct?.[k] ?? 0) / 100);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 战斗中读取单项属性 —— 引擎里所有属性读取都必须走这里, 不要直接读 cmb.stats。
// 概率类属性(暴击/闪避/格挡/异常抗性)在此处截到 RULES.combat.probCapPct。
// ---------------------------------------------------------------------------
const CAPPED_KEYS = new Set<keyof StatBlock>([
  "critRate",
  "dodgeRate",
  "blockRate",
  "ailmentResist",
]);

export function statOf(cmb: Combatant, key: keyof StatBlock): number {
  const statusFlat = cmb.statuses.reduce(
    (sum, inst) => sum + (STATUS_DEFS[inst.id]?.statMods?.[key] ?? 0) * inst.stacks,
    0,
  );
  const statusPct = cmb.statuses.reduce(
    (sum, inst) => sum + (STATUS_DEFS[inst.id]?.statModsPct?.[key] ?? 0) * inst.stacks,
    0,
  );
  const flat = cmb.stats[key] + (cmb.mods.flat?.[key] ?? 0) + statusFlat;
  const v = flat * (1 + ((cmb.mods.pct?.[key] ?? 0) + statusPct) / 100);
  return CAPPED_KEYS.has(key) ? capProb(v) : v;
}

// 往战斗内修正里写一笔(卡牌 / 状态 / 场景效果都走这里)。
export function addMod(
  cmb: Combatant,
  key: keyof StatBlock,
  amount: number,
  pct = false,
): void {
  const bucket = pct ? "pct" : "flat";
  const cur = cmb.mods[bucket] ?? (cmb.mods[bucket] = {});
  cur[key] = (cur[key] ?? 0) + amount;
}

// ---------------------------------------------------------------------------
// 派生量
// ---------------------------------------------------------------------------

// 该单位实际承受的有效负重。★ 只有我方吃 —— 背包是小队自己背的。
export function burdenOf(state: BattleState, cmb: Combatant): number {
  return cmb.team === "player" ? state.burden : 0;
}

function pollutionDodgeOf(cmb: Combatant): number {
  const stacks = cmb.statuses.find((status) => status.id === OVERLOAD_STATUS_ID)?.stacks ?? 0;
  return stacks * RULES.combat.overloadDodgePerStack;
}

// 命中概率(百分点, 已截断到 5%~100%)。攻击方 vs 防御方各出一半属性。
export function hitChance(
  state: BattleState,
  attacker: Combatant,
  defender: Combatant,
  bonusPct = 0,
): number {
  const c = RULES.combat;
  const dodge = capProb(statOf(defender, "dodgeRate") + pollutionDodgeOf(defender));
  const raw =
    c.baseHitChance +
    statOf(attacker, "hitRate") +
    statOf(attacker, "precision") -
    dodge -
    burdenHitPenalty(burdenOf(state, attacker)) +
    (attacker.team === "enemy" ? c.enemyBaseHitBonus : 0) +
    bonusPct;
  return Math.max(c.hitFloorPct, Math.min(c.hitCeilPct, raw));
}

// 暴击概率(百分点)。保留独立 helper 供 ops 与 UI 使用。
export function critChance(_state: BattleState, cmb: Combatant): number {
  return statOf(cmb, "critRate");
}

// 防御减伤后的乘数: 1 − 防御力 /(防御力 + 常量)。
export function defenseMultiplier(defender: Combatant): number {
  const def = Math.max(0, statOf(defender, "defense"));
  return 1 - def / (def + RULES.combat.defenseConstant);
}

// 我方小队先手均值 S_party —— 只算**存活**的上阵角色, 有人阵亡节奏就会变。
export function partyInitiative(state: BattleState): number {
  const alive = state.playerIds.map((id) => state.combatants[id]).filter((c) => c.alive);
  if (alive.length === 0) return 0;
  const average = alive.reduce((s, c) => s + statOf(c, "initiative"), 0) / alive.length;
  return average - burdenInitiativePenalty(state.burden);
}

// 敌人当前招式的蓄力时长: T = max(1, D_skill + S_party − S_enemy)。
export function enemyActDelay(state: BattleState, enemy: Combatant, moveDelay: number): number {
  const delta = partyInitiative(state) - statOf(enemy, "initiative");
  return Math.max(1, Math.round(moveDelay + delta));
}

// 小队手牌上限 / 每回合基础抽牌数 —— 上阵角色属性求和 + 全队修正(《角色养成设计.md》第六章)。
// ⚠ 用**建局时的全员**求和, 不随阵亡缩水: 队友倒下已经够惨了, 再砍手牌是双重惩罚。
export function squadHandLimit(sumCharHandLimit: number, mods: SquadResourceMods): number {
  const sum = RULES.hand.baseHandLimit + sumCharHandLimit + mods.handLimit;
  return Math.max(RULES.hand.minHandLimit, Math.min(RULES.squadCaps.handLimit, Math.round(sum)));
}

export function squadDrawCount(sumCharDrawCount: number, mods: SquadResourceMods): number {
  const sum = RULES.hand.partyBonusDrawCount + sumCharDrawCount + mods.drawCount;
  return Math.max(0, Math.min(RULES.squadCaps.drawCount, Math.round(sum)));
}

// 开局(第 1 回合)初始手牌数 —— 基础值、角色 drawCount 与起手训练叠加, 不受抽牌封顶影响。
export function squadOpeningDrawCount(sumCharDrawCount: number, mods: SquadResourceMods): number {
  return Math.max(0, Math.round(RULES.hand.openingHandSize + sumCharDrawCount + mods.openingHand));
}

export function squadManaPerRound(mods: SquadResourceMods): number {
  return Math.max(0, Math.min(RULES.squadCaps.mana, Math.round(RULES.resource.perRound + mods.mana)));
}

export function squadRedrawLimit(mods: SquadResourceMods): number {
  return Math.max(0, Math.round(RULES.timeline.redrawsPerRound + mods.redraws));
}

export function squadWaitLimit(mods: SquadResourceMods): number {
  return Math.max(0, Math.round(RULES.timeline.waitsPerRound + mods.waits));
}

export function partyHandLimit(state: BattleState): number {
  const sumCharHandLimit = state.playerIds.reduce(
    (sum, id) => sum + state.combatants[id].stats.handLimit,
    0,
  );
  return squadHandLimit(sumCharHandLimit, state.squadMods);
}

export function partyDrawCount(state: BattleState): number {
  const sumCharDrawCount = state.playerIds.reduce(
    (sum, id) => sum + state.combatants[id].stats.drawCount,
    0,
  );
  return squadDrawCount(sumCharDrawCount, state.squadMods);
}

export function partyOpeningDrawCount(state: BattleState): number {
  const sumCharDrawCount = state.playerIds.reduce(
    (sum, id) => sum + state.combatants[id].stats.drawCount,
    0,
  );
  return squadOpeningDrawCount(sumCharDrawCount, state.squadMods);
}

export function partyManaPerRound(state: BattleState): number {
  return squadManaPerRound(state.squadMods);
}

export function partyRedrawLimit(state: BattleState): number {
  return squadRedrawLimit(state.squadMods);
}

export function partyWaitLimit(state: BattleState): number {
  return squadWaitLimit(state.squadMods);
}

// 有效负重点数。探索页读数与开战时的快照都走它。
// 战斗内不再重算 —— 负重会在开战瞬间快照进 BattleState.burden。
export function burdenValue(occupiedSlots = 0, partyBurdenAdapt = 0): number {
  const adapt = Math.max(0, Math.min(100, partyBurdenAdapt));
  return occupiedSlots * (1 - adapt / 100);
}

export function burdenHitPenalty(burden: number): number {
  return Math.floor(burden / RULES.burden.hitPer);
}

export function burdenInitiativePenalty(burden: number): number {
  return Math.floor(burden / RULES.burden.initiativePer);
}
