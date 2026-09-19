import type { BoonEntry } from "../../../explore/types";
import type { DropEntry } from "../../../items/types";
import { DEFAULT_REGION_ID, regionalMaterial } from "../../items/regional";

// ⚠ 本表当前只服务废弃楼层（教程关与它共用同一批敌人，串掉可接受）。第二个地区落地时必须改成「档位 × 地区」两维。
// 拆成 neonCommonBase / gardenCommonBase，或让基础表接受 regionId 参数、由 regionalMaterial() 拼装。不要直接再塞一条地区材料。
export const COMMON_BASE: DropEntry[] = [
  { kind: "item", itemId: "green-crystal", chance: 0.2 },
  { kind: "item", itemId: regionalMaterial(DEFAULT_REGION_ID, "low").id, chance: 0.25 },
  { kind: "item", itemId: "copper-coin", chance: 0.4 },
  { kind: "item", itemId: "module-crate-t1", chance: 0.03 },
  { kind: "item", itemId: "relic-broken-compass", chance: 0.02 },
];

export const generalDrop = (itemId: string, chance: number): DropEntry => ({
  kind: "item",
  itemId,
  chance,
});

export const LOW_BOONS: BoonEntry[] = [
  { kind: "healDew", chance: 0.3 },
  { kind: "equipCrate", chance: 0.12 },
  { kind: "moduleCrate", chance: 0.05 },
  { kind: "cardOffer", chance: 0.4 },
];
