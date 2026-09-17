import type { CardAnim, EffectDescriptor, EnemyAiScript, StatBlock, Targeting } from "../../engine/types";
import type { BoonEntry } from "../../explore/types";
import type { DropEntry } from "../../items/types";

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
}

export interface EnemyDef {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  exp: number;
  fleeAfterRound?: number;
  actsPerRound?: number;
  ai?: EnemyAiScript;
  stats?: Partial<StatBlock>;
  moves: EnemyMove[];
  dropTable?: DropEntry[];
  boonTable?: BoonEntry[];
}
