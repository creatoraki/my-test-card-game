import type { ExploreEffect, ExploreAura, TradeBuffOption, TradeServiceKind } from "../explore/types";
import type { TradeStockKind } from "./tradeStock";

export interface TradeServiceDef {
  id: string;
  name: string;
  kind: TradeServiceKind;
  currencyItemId: string;
  price: number;
  desc: string;
  stockKind?: TradeStockKind;
  effects?: ExploreEffect[];
  buffOptions?: TradeBuffOption[];
}

const buff = (id: string, name: string, desc: string, mods: ExploreAura["mods"]): TradeBuffOption => ({
  weight: 1,
  aura: { id, name, desc, mods },
});

export const TRADE_BUFF_OPTIONS: TradeBuffOption[] = [
  buff("trade-overclock-protocol", "超频协议", "战斗中提高队伍先手。", { flat: { initiative: 4 } }),
  buff("trade-recovery-oxygen", "循环供氧", "战斗中提高队伍治疗效果。", { flat: { healBoost: 10 } }),
  buff("trade-fortification-grid", "防御网格", "战斗中提高队伍防御与格挡。", { flat: { defense: 3, blockRate: 5 } }),
].map((option, index) => ({ ...option, weight: [50, 30, 20][index] }));

const service = (
  id: string,
  name: string,
  kind: TradeServiceKind,
  currencyItemId: string,
  price: number,
  desc: string,
  extra: Pick<TradeServiceDef, "stockKind" | "effects" | "buffOptions"> = {},
): TradeServiceDef => ({ id, name, kind, currencyItemId, price, desc, ...extra });

export const TRADE_SERVICES: TradeServiceDef[] = [
  service("general-material-shop", "通用材料商店", "goods", "bread", 1, "展示 2 种通用材料，选择 1 种 ×1；材料占 1 格。", {
    stockKind: "material-general",
  }),
  service("near-expiry-food-shop", "临期食品商店", "goods", "cola", 1, "从 2 种食品中选择 1 种 ×1；候选不包含当前支付的可乐。", {
    stockKind: "food",
  }),
  service("regional-gathering-shop", "地区特色采集材料商店", "goods", "fried-chicken", 1, "展示 2 种本地区采集材料，选择 1 种 ×1；材料占 1 格。", {
    stockKind: "material-regional",
  }),
  service("monster-material-shop", "怪物材料商店", "goods", "fried-chicken", 1, "展示 2 种本地图怪物材料，选择 1 种 ×1；材料占 1 格。", {
    stockKind: "material-monster",
  }),
  service("consumable-shop", "消耗品商店", "goods", "hamburger", 1, "展示 2 种消耗品，选择 1 种 ×1；消耗品占 1 格。", {
    stockKind: "consumable",
  }),
  service("parcel-delivery", "包裹快递服务", "party", "pizza", 1, "选择最多 6 件可寄送物品转入远征寄件清单。", {
    effects: [{ type: "OPEN_CHUTE" }],
  }),
  service("medical-service", "医疗服务", "party", "milk", 1, "全队存活角色回复当前生命 20%，不修复体力极限。", {
    effects: [{ type: "HEAL_PARTY", percent: 0.2 }],
  }),
  service("random-party-buff", "随机团队 BUFF 服务", "random", "cola", 1, "公开 3 个团队 BUFF 及概率，随机获得 1 个远征光环。", {
    buffOptions: TRADE_BUFF_OPTIONS,
  }),
  service("weapon-shop", "武器商店服务", "goods", "hamburger", 1, "展示 2 件武器，选择 1 件；装备占 2 格。", {
    stockKind: "equip-weapon",
  }),
  service("card-draw-service", "抽卡服务", "pending", "pizza", 1, "指定角色后获得 3 张专属卡牌候选，选择 1 张加入待办奖励。", {
    effects: [{ type: "FORGE_DRAW" }],
  }),
  service("card-remove-service", "删卡服务", "pending", "bread", 2, "指定角色并永久删除 1 张合法卡牌，不能低于卡组最小张数。", {
    effects: [{ type: "FORGE_REMOVE" }],
  }),
  service("card-purify-service", "净化卡牌服务", "pending", "milk", 2, "指定角色，净化其最多 2 张污染卡牌。", {
    effects: [{ type: "PURIFY_CARDS", scope: "one", count: 2 }],
  }),
  service("quirk-treatment-service", "治疗怪癖服务", "pending", "milk", 2, "指定角色，治疗 1 个怪癖；没有怪癖时不可交易。", {
    effects: [{ type: "CURE_QUIRK", scope: "one", count: 1 }],
  }),
];

export function getTradeService(id: string): TradeServiceDef {
  const def = TRADE_SERVICES.find((serviceDef) => serviceDef.id === id);
  if (!def) throw new Error(`未知交易服务: ${id}`);
  return def;
}