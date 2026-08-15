import { rngInt, shuffle } from "../engine/rng";
import { getItemDef, getTradeService, makeItemStack } from "../data";
import { tradeStockDefs } from "../data/tradeStock";
import { addToContainer, countByItemId, consumeItems, occupiedSlots, stackSlots } from "../items/inventory";
import { RULES } from "../engine/rules";
import type { ItemStack } from "../items/types";
import type { ExploreEffect, ExploreState, NodeEvent, ShopState, TradeSlotState } from "./types";

export interface TradeQuote {
  ok: boolean;
  reason?: string;
}

export type TradeEffectRunner = (s: ExploreState, effect: ExploreEffect, defer?: boolean) => string;

function invalid(reason: string): TradeQuote {
  return { ok: false, reason };
}

function pickWeighted<T extends { weight: number }>(s: ExploreState, options: T[]): T {
  const total = options.reduce((sum, option) => sum + Math.max(0, option.weight), 0);
  if (total <= 0) return options[0];
  let roll = rngInt(s, Math.ceil(total * 1000)) / 1000;
  for (const option of options) {
    roll -= Math.max(0, option.weight);
    if (roll < 0) return option;
  }
  return options[options.length - 1];
}

function stockFor(s: ExploreState, serviceId: string): ItemStack[] {
  const service = getTradeService(serviceId);
  if (!service.stockKind) return [];
  let defs = tradeStockDefs(service.stockKind, s.mapId);
  if (service.id === "near-expiry-food-shop") {
    defs = defs.filter((def) => def.id !== service.currencyItemId);
  }
  return shuffle(s, defs)
    .slice(0, 2)
    .map((def) => makeItemStack(def.id));
}

function hasServiceTarget(s: ExploreState, serviceId: string): boolean {
  const alive = s.party.filter((member) => member.alive);
  if (serviceId === "card-remove-service") {
    return alive.some((member) => {
      const eligibility = member.tradeEligibility;
      return !eligibility || eligibility.deckSize > eligibility.minDeckSize;
    });
  }
  if (serviceId === "card-purify-service") {
    return alive.some((member) => !member.tradeEligibility || member.tradeEligibility.contaminatedCards > 0);
  }
  if (serviceId === "quirk-treatment-service") {
    return alive.some((member) => !member.tradeEligibility || member.tradeEligibility.quirkCount > 0);
  }
  return alive.length > 0;
}

function buffOptionsFor(s: ExploreState, serviceId: string) {
  const service = getTradeService(serviceId);
  return service.kind === "random" ? shuffle(s, service.buffOptions ?? []).slice(0, 3) : undefined;
}

export function openShop(s: ExploreState, event: NodeEvent): void {
  if (!event.services?.length || s.shop) return;
  const serviceIds = event.services.slice(0, 2);
  const slots: TradeSlotState[] = serviceIds.map((serviceId) => ({
    serviceId,
    stock: stockFor(s, serviceId),
    buffOptions: buffOptionsFor(s, serviceId),
    sold: false,
  }));
  s.shop = { eventId: event.id, slots, trades: 0, notes: [] };
}

export function tradeQuote(s: ExploreState, slotIndex: number, stockIndex?: number): TradeQuote {
  if (s.phase !== "shopping") return invalid("当前不在交易终端页面。");
  const shop = s.shop;
  if (!shop) return invalid("交易终端尚未接入。");
  const slot = shop.slots[slotIndex];
  if (!slot) return invalid("当前交易槽位不存在。");
  if (slot.sold) return invalid("该服务槽位已成交，本次抵达不再补货。");
  if (shop.trades >= shop.slots.length) return invalid("本次终端交易次数已达上限。");

  const service = getTradeService(slot.serviceId);
  const currency = getItemDef(service.currencyItemId);
  const selected = service.kind === "goods" ? slot.stock[stockIndex ?? -1] : undefined;
  if (service.kind === "goods" && !selected) return invalid("请先选择一个公开货位。");

  if (countByItemId(s.backpack, service.currencyItemId) < service.price) {
    return invalid(`当前无法交易：缺少 ${currency.name} ×${service.price}，食品未扣除。`);
  }

  if (selected) {
    const need = stackSlots(selected, getItemDef(selected.itemId));
    if (backpackFree(s) < need) {
      return invalid(`当前无法交易：${getItemDef(selected.itemId).name}需要 ${need} 格，请先完成背包替换；食品未扣除。`);
    }
  }

  if ((service.id === "medical-service" || service.kind === "random" || service.kind === "pending") && !hasServiceTarget(s, service.id)) {
    return invalid("当前无法交易：没有满足条件的存活角色，食品未扣除。");
  }
  if (service.kind === "random" && !slot.buffOptions?.length) {
    return invalid("当前无法交易：没有可用的团队 BUFF 候选，食品未扣除。");
  }
  if (service.id === "parcel-delivery" && s.chuteOpen) {
    return invalid("当前无法交易：投递口已经开启，食品未扣除。");
  }

  return { ok: true };
}

function tradeNote(serviceName: string, currencyName: string, price: number, result: string): string {
  return `交易完成：已支付 ${currencyName} ×${price}；${serviceName} · ${result}`;
}

export function buyFromShop(
  s: ExploreState,
  slotIndex: number,
  stockIndex: number | undefined,
  runEffect: TradeEffectRunner,
): boolean {
  const quote = tradeQuote(s, slotIndex, stockIndex);
  if (!quote.ok || !s.shop) return false;

  const slot = s.shop.slots[slotIndex];
  const service = getTradeService(slot.serviceId);
  const currency = getItemDef(service.currencyItemId);
  const selected = service.kind === "goods" ? slot.stock[stockIndex ?? -1] : undefined;
  s.backpack = consumeItems(s.backpack, service.currencyItemId, service.price);

  let result = "服务已执行";
  if (selected) {
    const added = addToContainer(s.backpack, [{ ...selected }], getItemDef, RULES.burden.backpackSlots);
    s.backpack = added.next;
    result = `获得 ${getItemDef(selected.itemId).name} ×${selected.count}`;
  } else if (service.kind === "random") {
    const option = pickWeighted(s, slot.buffOptions ?? []);
    if (!option) return false;
    const effect: ExploreEffect = { type: "GRANT_AURA", aura: option.aura };
    result = runEffect(s, effect, false);
  } else {
    for (const effect of service.effects ?? []) result = runEffect(s, effect, false);
  }

  slot.sold = true;
  s.shop.trades += 1;
  s.shop.notes.push(tradeNote(service.name, currency.name, service.price, result));
  return true;
}

export function closeShop(s: ExploreState): string[] {
  if (!s.shop) return [];
  const notes = s.shop.notes.length ? [...s.shop.notes] : ["你关闭了终端，没有支付食品。"];
  s.shop = null;
  return notes;
}