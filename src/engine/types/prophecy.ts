// ---------------------------------------------------------------------------
// 预言 —— 预言家对未来下的断言。状态挂在预言家身上, 期限内条件达成即应验。
// ---------------------------------------------------------------------------
export type ProphecyId = "goodOmen" | "omen" | "illOmen" | "apocalypse";

// 预言框架监听的事件。统一从 ops.prophecyEvent 进入(见 engine/prophecy/prophecy.ts)。
export type ProphecyEvent =
  | { type: "enemyKilled"; enemyId: string }
  | { type: "waterfall" }
  | { type: "beforeEnemyAct"; enemyId: string; moveKind: string }
  | { type: "afterEnemyAct"; enemyId: string }
  | { type: "starlightSpent"; amount: number }
  | { type: "expired"; statusId: string; ownerId: string };
