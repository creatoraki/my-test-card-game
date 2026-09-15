import type { MerchantPayment } from "./types";

export const MERCHANT_PRICES: readonly MerchantPayment[] = [
  { itemId: "bread", count: 2 },
  { itemId: "milk", count: 2 },
  { itemId: "hamburger", count: 1 },
  { itemId: "cola", count: 2 },
  { itemId: "fried-chicken", count: 1 },
  { itemId: "pizza", count: 1 },
];

export function merchantPrice(index: number): MerchantPayment {
  return MERCHANT_PRICES[index % MERCHANT_PRICES.length];
}
