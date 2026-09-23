// ============================================================================
// 探索会话 —— 纯 TS, 无 React、无副作用。所有函数直接修改传入的 ExploreState,
// 由 store 层负责 structuredClone 后再调用(与 engine/battle.ts 同惯例)。
//
// 远征流程: createSession → 房间图 → 进入房间 atNode → 打开物件 landed → resolving → confirmNode → atNode。
// 换房间: 站上传送门点亮小地图 → 确认传送(扣粒子) → 落地新房间(见 dungeon/session.ts)。
// 黑影: atNode → encounter → engageRoomThreat → inBattle; 战斗房战胜回原地。
// BOSS: 开启红门 → challengeBoss → inBattle; 胜利即通关(cleared)。
// 房间图在 dungeon/, 房间内的位置与交互在 corridor/, 物件决策在 curio/。
//
// 按职责分文件, 由本文件统一导出 —— 调用方一律从 explore/session 引入, 不直接引子模块。
// ============================================================================

export * from "./log";
export * from "./energy";
export * from "./drops";
export * from "./create";
export * from "./backpack";
export * from "./party";
export * from "./rewards";
export * from "./effects";
export * from "./items";
export * from "./pending";
export * from "./battle";
export * from "./scene";
export * from "./queries";
