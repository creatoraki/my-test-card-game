import type { CardAnim, EffectDescriptor, EnemyAiScript, StatBlock, Targeting } from "@/engine/types";
import type { BoonEntry } from "@/explore/types";
import type { DropEntry } from "@/items/types";

export type MoveBiasWhen =
  | { when: "anyFoeHasStatus"; status: string }
  | { when: "noFoeHasStatus"; status: string }
  | { when: "anyFoeHealRoomAtLeast"; value: number }
  | { when: "allyCountAtLeast"; value: number }
  | { when: "selfHasStatus"; status: string }
  | { when: "selfLacksStatus"; status: string }
  | { when: "anyAllyHpBelowPct"; value: number }
  | { when: "allyCountBelow"; value: number };

export type MoveBias = MoveBiasWhen & { multiplier: number };

export interface EnemyMove {
  id: string;
  name: string;
  emoji: string;
  cost: number; // 行动点消耗: 小招 3 / 普通 4~5 / 大招 6
  delay: number;
  kind: "attack" | "block" | "buff" | "debuff" | "special";
  targeting: Targeting;
  targetPick?: "random" | "highestShield" | "highestHealRoom" | "withStatus" | "withoutStatus" | "escortAlly";
  targetStatus?: string;
  effects: EffectDescriptor[];
  weight?: number;
  bias?: MoveBias[];
  hitBonus?: number;
  anim?: CardAnim;
  description?: string; // 有额外机制的招式使用完整中文说明
}

export interface EnemyDef {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  exp: number;
  fleeAfterRound?: number;
  apPerRound?: number; // 每回合回复的行动点, 缺省取 RULES.enemy.apPerRound
  ai?: EnemyAiScript;
  /** 攻击型敌人的基础攻击力至少为 100；调整攻击力时同比反向调整伤害及条件追加倍率，保持基础伤害。 */
  stats?: Partial<StatBlock>;
  moves: EnemyMove[];
  passiveDescription?: string;
  dropTable?: DropEntry[];
  boonTable?: BoonEntry[];
}
