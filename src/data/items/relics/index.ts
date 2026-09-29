// ============================================================================
// 遗物 —— 数据与代码位置约定
//
// 数据(本目录):
//   defineRelic.ts        标准书写格式与工厂
//   blessings/<稀有度>.ts  祝福遗物, 文件名 = 稀有度(common / fine / rare …)
//   curses/<稀有度>.ts     诅咒遗物, 同上
//   catalog.ts            全集 + 回收价
//   pools.ts              随机池 / 一次性遗物匣池的唯一入口
//   类型、渠道枚举与中文标签见 items/relic.ts
//
// 效果实现(desc 写得出、声明式字段表达不了的部分):
//   战斗内行为  engine/relics/behaviors/<稀有度>.ts     按 id 登记钩子
//   探索内行为  explore/relics/relicBehaviors.ts       按 id × 探索事件登记
//   探索读数    explore/relics/relicModifiers.ts       负重/货商/回收/开战属性等被动读数
//   ★ 每件遗物至少要有一种实现(声明式字段或上面三处之一), relicCatalog.test.ts 会校验。
// ============================================================================

export { defineRelics } from "./defineRelic";
export type { RelicEntry } from "./defineRelic";
export { BLESSING_RELIC_DEFS, CURSE_RELIC_DEFS, RELIC_ITEM_DEFS, RELIC_ITEM_IDS } from "./catalog";
export { RANDOM_RELIC_POOL, TEMPORARY_RELIC_POOL, randomRelicPool } from "./pools";
