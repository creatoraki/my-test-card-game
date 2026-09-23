import type { QuirkId } from "../combat/quirks";
import type { Team } from "./base";
import type { StatBlock, StatModifier } from "./stats";
import type { StatusInstance } from "./statuses";

// ---------------------------------------------------------------------------
// 战斗单位
// ---------------------------------------------------------------------------
export interface BaseCombatant {
  id: string;
  name: string;
  emoji: string;
  team: Team;
  hp: number;
  hpLimit: number; // 当前可治疗上限; 玩家受伤时会留下永久体力极限损伤
  maxHp: number; // 实时生命上限(建局时由 stats.maxHp 解析而来)
  shield: number; // 护盾值(可被伤害吸收)。⚠ 与"格挡"(blockRate, 概率减半)是两回事
  stats: StatBlock; // 局外已结算的面板(角色基础 + 装备)
  mods: StatModifier; // 战斗内修正(卡牌/状态/场景), 战斗结束即弃
  statuses: StatusInstance[];
  alive: boolean;
  tempo: number; // 已行进的持有者节拍数, 建局为 0
}

export interface Ally extends BaseCombatant {
  team: "player";
  charId: string;
  pollution: number;
  sick: boolean;
  quirks: QuirkId[];
}

export interface Intent {
  moveId: string;
  name: string;
  emoji: string;
  kind: "attack" | "block" | "buff" | "debuff" | "special";
  value?: number; // 预览数值(伤害/护盾)
}

export interface Enemy extends BaseCombatant {
  team: "enemy";
  enemyDefId: string;
  fled?: boolean;
  moveDelayDelta: number; // 遭遇战对每次抽取招式的延迟调整
  nextActTick: number | null; // 当前蓄力招式的发动时刻; null = 未在蓄力(行动点数已耗尽)
  actsPerRound: number; // 每回合行动次数上限, 建局时从 EnemyDef 拷入
  actsThisRound: number; // 本回合已消耗的行动点数
  intent: Intent;
  aiMemory?: EnemyAiMemory;
}

export interface EnemyAiMemory {
  lastMoveId?: string;
  actsSinceRecycle: number;
  hammerCooldown: number;
  openingDone: boolean;
  justBrokeShell: boolean;
}

export interface EnemyAiScript {
  openingMoveId: string;
  recycleMoveId: string;
  shredMoveId: string;
  hammerMoveId: string;
  breatherMoveIds: string[];
  breatherWeights: Record<string, number>;
  successors: Record<string, Record<string, number>>;
  thresholds: {
    soloShield: number;
    partyShield: number;
    nearZeroShield: number;
    imbalanceRatio: number;
    concentration: number;
  };
  hammerOverride: number;
  hammerCooldown: number;
  recycleInsurance: number;
  brittleShredBias: number;
}

export type Combatant = Ally | Enemy;

// ---------------------------------------------------------------------------
// 遭遇战改造器 —— 建局时对 EncounterDef 的一次性加成。
// 探索层的净化粒子档位通过它注入战斗(见 explore/session/energy.ts encounterModifier);
// 引擎本身不认识危险度, 只认识这四条改造 —— 日后任何"动态难度"来源都可复用这个结构。
// ---------------------------------------------------------------------------
export interface EncounterModifier {
  extraEnemies?: string[]; // 追加的敌人 defId(排在原有敌人之后, 走默认站位)
  enemyStatuses?: StatusInstance[]; // 全体敌人的开局状态
  moveDelayDelta?: number; // 每次抽招式的延迟调整, 最终延迟钳到下限 1
  hpMultiplier?: number; // 敌人 maxHp 倍率(BOSS 缩放用), 缺省 1
  attackMultiplier?: number; // 地图难度的敌人攻击力倍率，缺省 1
}
