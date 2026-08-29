import type { CardAnim, EffectDescriptor, EnemyAiScript, StatBlock, Targeting } from "../../engine/types";
import type { BoonEntry } from "../../explore/types";
import type { DropEntry } from "../../items/types";

export interface EnemyMove {
  id: string;
  name: string;
  emoji: string;
  delay: number;
  kind: "attack" | "block" | "buff" | "debuff" | "special";
  targeting: Targeting;
  targetPick?: "random" | "highestShield";
  effects: EffectDescriptor[];
  weight?: number;
  hitBonus?: number;
  anim?: CardAnim;
}

export interface EnemyDef {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  exp: number;
  actsPerRound?: number;
  ai?: EnemyAiScript;
  stats?: Partial<StatBlock>;
  moves: EnemyMove[];
  dropTable?: DropEntry[];
  boonTable?: BoonEntry[];
}
