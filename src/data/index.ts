// 数据层聚合入口 —— 引擎/store/UI 统一从这里取数据。getter 与实例工厂的实现在 registry.ts。
// ⚠ data 目录内部的模块不要从本文件取东西, 直接引具体文件, 否则会形成运行时依赖环。

export {
  SQUAD_BADGES,
  addSquadMods,
  branchNodesOf,
  canActivate,
  canRefund,
  costToReach,
  getBadge,
  getNode,
  hasActivatableNode,
  isUnlocked,
  pathTo,
  spentPoints,
  squadModsOf,
  type SquadBadgeDef,
  type SquadResourceKey,
  type SquadResourceMods,
  type TalentBranchDef,
  type TalentNodeDef,
} from "./roster/squadTalents";

export { CARD_DEFS } from "./cards";
export { ASSEMBLE_REWARD_POOLS } from "./cards/alchemist";
export { CHARACTERS, type CharacterDef } from "./roster/characters";
export {
  BOND_DEFS,
  BOND_BIAS,
  ROLLABLE_BOND_IDS,
  activeBonds,
  bondPool,
  getBondDef,
  mergeMods,
  nextTier,
  rerollBond,
  type BondDef,
  type BondTier,
} from "./roster/bonds";
export { ENEMIES, type EnemyDef, type EnemyMove, type MoveBias, type MoveBiasWhen } from "./enemies";
export {
  ENCOUNTERS,
  slotDefId,
  slotPlacement,
  type EncounterDef,
  type EnemyPlacement,
  type EnemySlot,
} from "./encounters";
export {
  MAPS,
  visibleMaps,
  isMapUnlocked,
  mapEquipRarities,
  mapLockReason,
  type MapDef,
} from "./maps";
export {
  MAP_DIFFICULTIES,
  MAP_DIFFICULTY_IDS,
  difficultyEquipRarities,
  difficultyKey,
  difficultyLockReason,
  difficultyMapConfig,
  getMapDifficulty,
  isDifficultyUnlocked,
  mapHasDifficulty,
  mapDifficultyIds,
  type MapDifficulty,
  type MapDifficultyDef,
} from "./maps/mapDifficulty";
export {
  FIXED_CLEAR_REWARDS,
  fixedClearRewardOf,
  type MapClearRewardDef,
} from "./maps/mapClearReward";
export { rollAllDailyClearRewards, rollDailyClearReward } from "./maps/mapDailyReward";
export {
  AID_SUPPLY_MAP_OVERRIDES,
  AID_SUPPLY_OVERRIDES,
  DEFAULT_AID_SUPPLY,
  aidSupplyOf,
  makeAidSupplyStacks,
  type AidSupplyEntry,
} from "./maps/mapAidSupply";
export {
  CONSUMABLE_ITEM_DEFS,
  DESIGN_ITEM_DEFS,
  EQUIPMENT_ITEM_DEFS,
  GENERIC_MODULE_FAMILY,
  GENERIC_MODULE_ITEM_DEFS,
  MATERIAL_ITEM_DEFS,
  MODULE_CRATE_ITEM_DEFS,
  MODULE_ITEM_DEFS,
  NEAR_EXPIRY_FOOD_IDS,
  DEFAULT_REGION_ID,
  REGIONAL_MATERIAL_DEFS,
  RELIC_ITEM_DEFS,
  RELIC_ITEM_IDS,
  BLESSING_RELIC_DEFS,
  CURSE_RELIC_DEFS,
  itemRegionId,
  regionalMaterial,
  regionalTierOf,
} from "./items";
export type { RegionalMaterialDef, RegionalTier } from "./items";
export {
  CARD_MODULES,
  GENERIC_T1_MODULE_IDS,
  canEquipModule,
  getCardModule,
  hasDamageEffect,
  hasScaledDamage,
  hasScaledSupport,
  recomputeCardModule,
  type CardModuleDef,
} from "./cardModules";
export {
  MODULE_RECIPES,
  craftCheck,
  getModuleRecipe,
  materialCount,
  recipesOfCharacter,
  type CraftCheck,
  type ModuleRecipe,
} from "./crafting/moduleCrafting";
export {
  NUTRITION_MAX_LEVEL,
  NUTRITION_POD_MAX,
  NUTRITION_TECH_CANVAS,
  NUTRITION_TECHS,
  NUTRITION_TREAT_COST,
  isTechAvailable,
  nutritionHeal,
  nutritionLevel,
  nutritionPods,
  nutritionTechCost,
  nutritionTechState,
  type NutritionTech,
  type NutritionTechKind,
  type NutritionTechState,
} from "./facilities/nutritionPod";
export {
  SHOP_MAX_LEVEL,
  CARD_SHOP_PRICE,
  SHOP_TECH_CANVAS,
  SHOP_TECHS,
  shopRefreshBase,
  shopLevelOf,
  shopRefreshCost,
  shopSlotCount,
  shopTechCost,
  shopTechState,
  isShopTechAvailable,
  type ShopTechKind,
  type ShopTechState,
  type ShopTech,
} from "./shop/shopTech";
export {
  DEFAULT_SHOP_LEVEL,
  SHOP_KIND_WEIGHTS,
  SHOP_LEVELS,
  pickShopKind,
  rollShopItemSlot,
  shopLevel,
  type ShopItemKind,
  type ShopKind,
  type ShopCardSlot,
  type ShopItemSlot,
  type ShopLevel,
  type ShopSlot,
} from "./shop/shop";
export {
  materialCostCheck,
  techCostCheck,
  type TechCost,
  type TechCostCheck,
  type TechCostMaterialCheck,
} from "./crafting/techCost";
export {
  TECH_CATEGORIES,
  TECH_BRANCHES,
  TECH_NODES,
  TECH_TREE_CANVAS,
  branchOf,
  categoryOf,
  sellPriceOf,
  techLevel,
  techNextCost,
  techNode,
  techNodeCheck,
  techNodeState,
  techScrapSellRate,
  techTrainingBonus,
  type TechBranchDef,
  type TechCategoryDef,
  type TechNodeDef,
  type TechNodeState,
  type TechTreeState,
} from "./techTree";
export {
  reforgeCost,
  reforgeCheck,
  upgradeCheck,
  upgradeRecipe,
  type CostCheck,
  type MaterialCost,
  type UpgradeRecipe,
} from "./crafting/equipUpgrade";
export { SORTIE_STOCK_IDS } from "./shop/sortieStock";
export {
  CORRIDOR_AMBUSH,
  CORRIDOR_CURIOS,
  HEAL_CURIO_KINDS,
  RANDOM_CURIO_WEIGHTS,
  TRAP_CURIO_KINDS,
  corridorGuardEvent,
  corridorWandererEvent,
  corridorAlarmEvent,
  curioEvent,
} from "./curios";
export type {
  ActorTarget,
  CurioDef,
  CurioDecision,
  CurioEffect,
  CurioFailure,
  CurioLevel,
  CurioMitigation,
  MerchantShelf,
} from "./curios";
export { PICNIC_RECIPES, matchPicnicRecipe, type PicnicRecipeDef } from "./facilities/picnicRecipes";
export { pickBotLine } from "./lines/botLines";
export { VENDOR_LINES, pickVendorLine, type VendorLineKind } from "./lines/vendorLines";
export {
  TOWN_BOT_LINES,
  pickTownBotLine,
  type TownBotLineKind,
} from "./lines/townBotLines";
export { EXPLORER_LINES, pickExplorerLine, type ExplorerLineKind } from "./lines/explorerLines";
export { SANCTUARY_RULES } from "./facilities/sanctuary";

export * from "./registry";
