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
  | { type: "REPLACE_CARD_COMMON" }
  | { type: "CONSUME_ITEM"; itemId: string; count: number };

export interface CurioDecision {
  id: string;
  label: string;
  story: string;
  require?: CurioRequirement;
  risk?: { chance: number; effects: CurioEffect[] };
  effects: CurioEffect[];
}

export interface CurioDef {
  name: string;
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
  opened: boolean;
}

export interface CurioEffectContext {
  actorId: string;
  offered: ItemStack[];
}

export type CurioState = Pick<ExploreState, "backpack" | "party">;
