import type { Card } from "@/engine";

/** 三选一的一个候选。key 在同一批候选内唯一; ownerCharId 缺省取 card.ownerCharId。 */
export interface CardPickOption {
  key: string;
  card: Card;
  ownerCharId?: string;
}
