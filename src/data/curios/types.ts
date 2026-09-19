import type { ExploreEffect, ExploreState } from "@/explore/types";
import type { ItemStack } from "@/items/types";

export type ActorTarget = "actor" | "random" | "party" | { job: string };

export interface OfferingPart {
  match: {
    itemIds?: string[];
    familyId?: string;
    category?: "equipment";
    relicPolarity?: "blessing" | "curse";
  };
  count: number;
}

export type CurioRequirement =
  | { kind: "job"; charId: string }
  | { kind: "offering"; recipes: OfferingPart[][] };

export type CurioEffect =
  | ExploreEffect
  | { type: "GAIN_POOL_ITEM"; pool: RewardPoolId; count: number }
  | { type: "DAMAGE_MEMBER_PERCENT"; target: ActorTarget; percent: number }
  | { type: "ADJUST_POLLUTION"; target: ActorTarget; amount: number }
  | { type: "REVEAL_MAP"; threats: boolean }
  | { type: "FUSE_EQUIPMENT" }
  | { type: "UPGRADE_RELIC" }
  | { type: "FORGE_DRAW_TAINTED"; contaminate: number }
  | { type: "REPLACE_CARD_COMMON"; foodCost?: number }
  | { type: "TUNE_EQUIPMENT"; mode: "bond" | "perfectness"; foodCost: number }
  | { type: "GRANT_DISPOSABLE_RELIC" }
  | { type: "CONSUME_ITEM"; itemId: string; count: number };

export interface CurioDecision {
  id: string;
  label: string;
  story: string;
  /** 明码食品支付，可混付六种临期食品；无此字段不收食品。 */
  foodCost?: number;
  require?: CurioRequirement;
  risk?: { chance: number; effects: CurioEffect[] };
  effects: CurioEffect[];
}

/** 物件在投放与历史记录中的分类：物品奖励、治疗、风险房、服务。 */
export type CurioRole = "loot" | "heal" | "risk" | "service";

export interface CurioDef {
  name: string;
  role: CurioRole;
  /** 进房立即触发：不能暂不处理，也不消耗交互粒子。 */
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
