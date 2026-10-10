import type { ExploreEffect, ExploreState } from "@/explore/types";
import type { ItemStack } from "@/items/types";
import type { MechanicalCritterId } from "./defs/critters";

export type ActorTarget = "actor" | "random" | "party" | { job: string };

export interface ItemMatch {
  itemIds?: string[];
  familyId?: string;
  category?: "equipment";
  relicPolarity?: "blessing" | "curse";
}

export interface OfferingPart {
  match: ItemMatch;
  count: number;
}

export type CurioEffect =
  | ExploreEffect
  | { type: "GAIN_POOL_ITEM"; pool: RewardPoolId; count: number }
  | { type: "DAMAGE_MEMBER_PERCENT"; target: ActorTarget; percent: number }
  | { type: "ADJUST_POLLUTION"; target: ActorTarget; amount: number }
  | { type: "REVEAL_MAP"; threats: boolean }
  | { type: "FUSE_EQUIPMENT" }
  | { type: "UPGRADE_RELIC" }
  | { type: "FORGE_DRAW_TAINTED"; contaminate: number }
  | { type: "REPLACE_CARD_COMMON" }
  | { type: "TUNE_EQUIPMENT"; mode: "bond" | "perfectness"; foodCost: number }
  | { type: "GRANT_DISPOSABLE_RELIC" }
  | { type: "CONSUME_ITEM"; itemId: string; count: number }
  /** 从候选效果里不重复地随机抽 pick 条执行，交互时才掷。 */
  | { type: "ROLL_EFFECTS"; pick: number; options: CurioEffect[] }
  /** 失败引来守卫战，档位见 rules/curioRules.ts。 */
  | { type: "ALARM_BATTLE" };

/** 隐性门槛：执行者职业，或背包里的指定物品(生效时自动消耗 1 个)。 */
export type MitigationCondition =
  | { kind: "job"; charId: string }
  | { kind: "item"; match: ItemMatch };

export interface CurioMitigation {
  when: MitigationCondition;
  /** 失败率修正，负数降低。 */
  chanceDelta?: number;
  /** 成功时追加的奖励。 */
  bonusEffects?: CurioEffect[];
  /** 失败时改为这段正面结果，而不是惩罚。 */
  convert?: { story: string; effects: CurioEffect[] };
  /** 门槛生效时写进结算文案的一句话。 */
  note?: string;
}

/** 隐藏的交互失败：概率、失败文案与惩罚，以及可以压低或转化它的门槛。 */
export interface CurioFailure {
  chance: number;
  story: string;
  effects: CurioEffect[];
  mitigations?: CurioMitigation[];
}

export interface CurioDecision {
  id: string;
  label: string;
  story: string;
  /** 明码食品支付，可混付六种临期食品；无此字段不收食品。 */
  foodCost?: number;
  /** 喂养机械小生物：背包里同一种对应食物达到数量才出现，选择时自动扣除。 */
  feed?: { critter: MechanicalCritterId; count: number };
  /** 功能性服务需要玩家挑选具体物品(熔合装备、升级遗物)；不是门槛。 */
  select?: OfferingPart[][];
  effects: CurioEffect[];
  failure?: CurioFailure;
}

/** 物件在投放与历史记录中的分类：物品奖励、治疗、陷阱、服务。 */
export type CurioRole = "loot" | "heal" | "trap" | "service";

export interface CurioDef {
  name: string;
  role: CurioRole;
  /** 陷阱：进房立即触发，不能暂不处理，也不消耗交互粒子。 */
  forced?: boolean;
  /** 事件面板大标题下的英文副标题；缺省时显示通用副标题。 */
  enName?: string;
  verb: string;
  size: number;
  description: string;
  decisions: CurioDecision[];
  persistent?: boolean;
}

export type RewardPoolId =
  | "generalMaterial"
  | "generalMaterialOrScrap"
  | "scrap"
  | "premiumScrap"
  | "crystal"
  | "basicFood"
  | "food"
  | "highFood"
  | "consumable"
  | "module";

export interface RewardPoolEntry {
  itemId: string;
  weight: number;
}

export type MerchantPayment = { itemId: string; count: number };

export type MerchantSlot =
  | {
      kind: "card";
      charId: string;
      cardDefId: string;
      price: MerchantPayment;
      sold: boolean;
    }
  | {
      kind: "item";
      stack: ItemStack;
      price: MerchantPayment;
      sold: boolean;
    };

export interface MerchantShelf {
  slots: MerchantSlot[];
  foods: [string, string];
  opened: boolean;
}

export interface CurioEffectContext {
  actorId: string;
  offered: ItemStack[];
}

export type CurioState = Pick<ExploreState, "backpack" | "party">;
