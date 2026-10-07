// 方舟机制的可序列化运行态；卡牌身份与费用仍由原卡牌实例保存。
export interface ArkEnemyState {
  heldCards: string[];
  heldMana: number;
  guardOwnerId?: string;
  barrage?: { ammo: number; endsAt: number };
  barrageCooldown: number;
}

export interface ArkAttackFrame {
  cardUid: string;
  ownerId: string;
  reducedIds: string[];
  hitIds: string[];
}

export interface ArkBattleState {
  attacks: ArkAttackFrame[];
  pendingPlays: string[];
  deferredAttack?: ArkAttackFrame;
}
