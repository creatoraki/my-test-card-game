// ============================================================================
// 物品图标查找表 —— 与 enemyArt.ts / cardArt.ts 同约定: 数据层不碰素材, UI 层查表。
//
// ★ 没有专属美术的物品继续使用内联线框 SVG, 已登记美术资源的物品优先显示图片:
//   · emoji 在 Windows 上会渲染成彩色贴纸, 和暗色科技风冲突(与 TownScreen/CryoScene 同结论)。
//
// ★ 全部用 stroke="currentColor" ⇒ 颜色由父级 .item-slot 的 color: var(--rr) 决定,
//   于是**一套 7 个图标自动覆盖全部五档稀有度**, 不需要 35 张图。
//   日后有了美术资源, 把某个 key 换成 <img src=…> 即可, 调用方一行都不用动。
// ============================================================================

import type { ReactNode } from "react";
import { regionalTierOf, type RegionalTier } from "@/data/items/regional";
import type { EquipSlot, ItemCategory, ItemDef } from "@/items/types";
import { ModuleGlyph, hasModuleGlyph } from "./moduleGlyphs";
import deflectionBladeArt from "@/assets/道具/装备/武器/太刀.png";
import saberArt from "@/assets/道具/装备/武器/军刀.png";
import crossSwordArt from "@/assets/道具/装备/武器/盾斧.png";
import huntingRifleArt from "@/assets/道具/装备/武器/狙击枪.png";
import glassDaggerArt from "@/assets/道具/装备/武器/匕首.png";
import armorPiercingCrossbowArt from "@/assets/道具/装备/武器/弩.png";
import quickstrikeGauntletArt from "@/assets/道具/装备/武器/拳套.png";
import hunterLongbowArt from "@/assets/道具/装备/武器/弓箭.png";
import heavyCannonArt from "@/assets/道具/装备/武器/火炮.png";
import crystalOrbArt from "@/assets/道具/装备/武器/水晶球.png";
import warHammerArt from "@/assets/道具/装备/武器/锤子.png";
import spellbookArt from "@/assets/道具/装备/武器/魔法书.png";
import cityDefenseHeavyArmorArt from "@/assets/道具/装备/防具/城防重甲.png";
import compositeArmorArt from "@/assets/道具/装备/防具/复合护甲.png";
import guardPlateArt from "@/assets/道具/装备/防具/护卫板甲.png";
import hazmatSuitArt from "@/assets/道具/装备/防具/防毒战衣.png";
import mobileArmorArt from "@/assets/道具/装备/防具/机动护甲.png";
import bufferCoatArt from "@/assets/道具/装备/防具/缓冲外套.png";
import lifeSupportArmorArt from "@/assets/道具/装备/防具/生命维持甲.png";
import assaultExoskeletonArt from "@/assets/道具/装备/防具/突击外骨骼.png";
import fireControlArmorArt from "@/assets/道具/装备/防具/火控战甲.png";
import raiderLightArmorArt from "@/assets/道具/装备/防具/破袭轻甲.png";
import polarizedCoreArt from "@/assets/道具/装备/饰品/偏振核心.png";
import medicalPendantArt from "@/assets/道具/装备/饰品/医疗吊坠.png";
import reactionCharmArt from "@/assets/道具/装备/饰品/反应护符.png";
import quickstepWatchArt from "@/assets/道具/装备/饰品/急行怀表.png";
import tacticalGogglesArt from "@/assets/道具/装备/饰品/战术目镜.png";
import criticalPrismArt from "@/assets/道具/装备/饰品/暴击棱镜.png";
import lifeThornRingArt from "@/assets/道具/装备/饰品/生命棘环.png";
import breachBeaconArt from "@/assets/道具/装备/饰品/破阵信标.png";
import burdenModuleArt from "@/assets/道具/装备/饰品/负重模块.png";
import medicalKitArt from "@/assets/道具/消耗品/医疗包.png";
import holyWaterArt from "@/assets/道具/消耗品/圣水.png";
import fruitJuiceArt from "@/assets/道具/消耗品/果汁.png";
import sugarCubeArt from "@/assets/道具/消耗品/糖块.png";
import colaArt from "@/assets/道具/临期食品/可乐.png";
import pizzaArt from "@/assets/道具/临期食品/披萨.png";
import hamburgerArt from "@/assets/道具/临期食品/汉堡.png";
import friedChickenArt from "@/assets/道具/临期食品/炸鸡.png";
import milkArt from "@/assets/道具/临期食品/牛奶.png";
import breadArt from "@/assets/道具/临期食品/面包.png";
import batteryArt from "@/assets/道具/材料/通用材料/电池.png";
import cubeArt from "@/assets/道具/材料/通用材料/魔方.png";
import gearArt from "@/assets/道具/材料/通用材料/齿轮.png";
import greenCrystalArt from "@/assets/道具/材料/通用材料/绿色水晶.png";
import blueCrystalArt from "@/assets/道具/材料/通用材料/蓝色水晶.png";
import redCrystalArt from "@/assets/道具/材料/通用材料/红色水晶.png";
import placeholderArt from "@/assets/占位素材.png";
import bronzeBearArt from "@/assets/道具/换金物/铜质小熊.png";
import silverBearArt from "@/assets/道具/换金物/银质小熊.png";
import goldenBearArt from "@/assets/道具/换金物/金质小熊.png";

const VB = "0 0 48 48";
const base = {
  viewBox: VB,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// 废料: 三块参差的碎片叠在一起
const ScrapIcon = () => (
  <svg {...base}>
    <path d="M9 30 L16 15 L27 19 L23 33 Z" />
    <path d="M25 12 L37 16 L34 26 L26 21 Z" opacity=".55" />
    <path d="M18 34 L31 32 L34 39 L21 40 Z" opacity=".8" />
  </svg>
);

// 模组材料: 断了两齿的齿轮 + 中心方孔
const MaterialIcon = () => (
  <svg {...base}>
    <circle cx="24" cy="24" r="11" />
    <rect x="20" y="20" width="8" height="8" rx="1" />
    <path d="M24 8 v5 M35 13 l-3.5 3.5 M40 24 h-5 M35 35 l-3.5-3.5 M13 35 l3.5-3.5 M8 24 h5" />
  </svg>
);

// 成品模组: 四角断线框、六角承载环、轨道核心与四向引脚
const ModuleIcon = () => (
  <svg {...base}>
    <path d="M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9" opacity=".45" />
    <path d="M24 10 35 16v16L24 38 13 32V16Z" strokeWidth="1.6" />
    <circle cx="24" cy="24" r="7" strokeDasharray="2.5 2.5" opacity=".7" />
    <circle cx="24" cy="24" r="2.5" />
    <path d="M24 4v6M44 24h-9M24 44v-6M4 24h6" opacity=".6" />
  </svg>
);

// 武器: 竖直的撬棒/短刃 + 缠绕的握把线
const WeaponIcon = () => (
  <svg {...base}>
    <path d="M24 6 L28 12 V27 H20 V12 Z" />
    <path d="M20 27 h8 v4 h-8 z" />
    <path d="M22 31 v11 M26 31 v11" opacity=".7" />
    <path d="M20 34 h8 M20 38 h8" opacity=".45" />
  </svg>
);

// 防具: 切角护板 + 两个铆钉 + 一道裂纹
const ArmorIcon = () => (
  <svg {...base}>
    <path d="M13 12 h16 l6 6 v18 l-5 4 H13 Z" />
    <circle cx="19" cy="18" r="1.6" opacity=".7" />
    <circle cx="19" cy="33" r="1.6" opacity=".7" />
    <path d="M28 15 L25 25 L30 27 L26 36" opacity=".5" />
  </svg>
);

// 饰品: 吊环 + 菱形坠 + 内部同心菱
const TrinketIcon = () => (
  <svg {...base}>
    <circle cx="24" cy="11" r="4" />
    <path d="M24 15 L34 26 L24 41 L14 26 Z" />
    <path d="M24 21 L29 26 L24 33 L19 26 Z" opacity=".55" />
  </svg>
);

// 数据存档: 芯片方框 + 两侧引脚 + 中心读写缝
const DataIcon = () => (
  <svg {...base}>
    <rect x="14" y="14" width="20" height="20" rx="2" />
    <path d="M20 22 h8 M20 26 h8" opacity=".6" />
    <path d="M14 19 h-5 M14 24 h-5 M14 29 h-5 M34 19 h5 M34 24 h5 M34 29 h5" opacity=".7" />
  </svg>
);

// 消耗品: 软管/注射管 + 刻度线
const ConsumableIcon = () => (
  <svg {...base}>
    <path d="M18 10 h12 v6 l-2 24 a4 4 0 0 1 -8 0 l-2 -24 Z" />
    <path d="M18 16 h12" opacity=".7" />
    <path d="M20 24 h4 M20 29 h4 M20 34 h4" opacity=".45" />
  </svg>
);

const ICONS: Record<string, () => ReactNode> = {
  scrap: ScrapIcon,
  material: MaterialIcon,
  module: ModuleIcon,
  weapon: WeaponIcon,
  armor: ArmorIcon,
  trinket: TrinketIcon,
  data: DataIcon,
  consumable: ConsumableIcon,
};

/** 空装备槽的部位占位图标, 与 itemIcon 同族并继承调用方的 currentColor。 */
export function equipSlotIcon(slot: EquipSlot): ReactNode {
  const Icon = ICONS[slot];
  return <Icon />;
}

// 没登记 icon 时按类别兜底 —— 新增物品忘了写 icon 也不会开天窗。
const BY_CATEGORY: Record<ItemCategory, string> = {
  scrap: "scrap",
  material: "material",
  module: "module",
  equipment: "armor",
  data: "data",
  consumable: "consumable",
};

const EQUIPMENT_ART: Record<string, string> = {
  "armor-piercing-crossbow": armorPiercingCrossbowArt,
  "hunting-rifle": huntingRifleArt,
  "quickstrike-gauntlet": quickstrikeGauntletArt,
  "cross-sword": crossSwordArt,
  "glass-dagger": glassDaggerArt,
  "heavy-cannon": heavyCannonArt,
  "hunter-longbow": hunterLongbowArt,
  "deflection-blade": deflectionBladeArt,
  saber: saberArt,
  "crystal-orb": crystalOrbArt,
  "war-hammer": warHammerArt,
  spellbook: spellbookArt,
  "city-defense-heavy-armor": cityDefenseHeavyArmorArt,
  "composite-armor": compositeArmorArt,
  "guard-plate": guardPlateArt,
  "hazmat-suit": hazmatSuitArt,
  "mobile-armor": mobileArmorArt,
  "buffer-coat": bufferCoatArt,
  "life-support-armor": lifeSupportArmorArt,
  "assault-exoskeleton": assaultExoskeletonArt,
  "fire-control-armor": fireControlArmorArt,
  "raider-light-armor": raiderLightArmorArt,
  "tactical-goggles": tacticalGogglesArt,
  "polarized-core": polarizedCoreArt,
  "quickstep-watch": quickstepWatchArt,
  "medical-pendant": medicalPendantArt,
  "reaction-charm": reactionCharmArt,
  "critical-prism": criticalPrismArt,
  "life-thorn-ring": lifeThornRingArt,
  "breach-beacon": breachBeaconArt,
  "burden-module": burdenModuleArt,
};

const CONSUMABLE_ART: Record<string, string> = {
  "sugar-cube": sugarCubeArt,
  "medical-kit": medicalKitArt,
  "holy-water": holyWaterArt,
  "fruit-juice": fruitJuiceArt,
  milk: milkArt,
  bread: breadArt,
  cola: colaArt,
  hamburger: hamburgerArt,
  "fried-chicken": friedChickenArt,
  pizza: pizzaArt,
};

const MATERIAL_ART: Record<string, string> = {
  "logic-cube": cubeArt,
  "standard-gear": gearArt,
  "standard-battery": batteryArt,
  "coil-spring": placeholderArt,
  magnet: placeholderArt,
  "green-crystal": greenCrystalArt,
  "blue-crystal": blueCrystalArt,
  "red-crystal": redCrystalArt,
};

// 水晶: 三种同为普通品级, **颜色是它们唯一的区分信息** —— 所以刻意不吃 currentColor
// (那会让三种水晶按稀有度渲染成一模一样的图标), 而是按 id 固定取色。
// 日后有了美术资源, 把这里换成 MATERIAL_ART 里的 <img> 条目即可。
const CRYSTAL_COLOR: Record<string, string> = {
  "green-crystal": "#4ade80",
  "blue-crystal": "#60a5fa",
  "red-crystal": "#f87171",
};

// 没有素材时仍保留颜色 SVG 兜底, 避免资源加载失败时出现空图标。
const CrystalIcon = ({ color }: { color: string }) => (
  <svg {...base} stroke={color}>
    <path d="M24 7 34 19 24 41 14 19Z" strokeWidth="1.8" />
    <path d="M14 19h20M24 7v34" opacity=".55" />
    <path d="M19 13 24 19 29 13" opacity=".4" />
  </svg>
);

const RegionalTierIcon = ({ tier }: { tier: RegionalTier }) => (
  <svg {...base}>
    {tier === "low" && (
      <>
        <path d="M17 8h14l-2 32H19Z" />
        <path d="M18 15h12M18 22h11M18 29h10" opacity=".55" />
        <path d="M21 8 19 4M27 8V4M33 8l2-4" opacity=".7" />
      </>
    )}
    {tier === "mid" && (
      <>
        <path d="m14 16 10-6 10 6v16l-10 6-10-6Z" />
        <path d="M14 16 24 22 34 16M24 22v16" opacity=".55" />
        <path d="M19 13 29 29" opacity=".45" />
      </>
    )}
    {tier === "boss" && (
      <>
        <circle cx="24" cy="24" r="13" />
        <circle cx="24" cy="24" r="5" />
        <path d="M24 4v7M24 37v7M4 24h7M37 24h7" opacity=".7" />
        <path d="m15 15 4 4M33 15l-4 4M15 33l4-4M33 33l-4-4" opacity=".5" />
      </>
    )}
  </svg>
);

const SCRAP_ART: Record<string, string> = {
  "bronze-bear": bronzeBearArt,
  "silver-bear": silverBearArt,
  "golden-bear": goldenBearArt,
};

export const ITEM_ART_SOURCES: readonly string[] = [...new Set([
  ...Object.values(EQUIPMENT_ART),
  ...Object.values(CONSUMABLE_ART),
  ...Object.values(MATERIAL_ART),
  ...Object.values(SCRAP_ART),
])];

export function itemIcon(def: ItemDef): ReactNode {
  const art =
    EQUIPMENT_ART[def.id] ??
    (def.familyId ? EQUIPMENT_ART[def.familyId] : undefined) ??
    (def.familyId ? CONSUMABLE_ART[def.familyId] : undefined) ??
    CONSUMABLE_ART[def.id] ??
    MATERIAL_ART[def.id] ??
    SCRAP_ART[def.id];
  if (art) return <img src={art} alt="" />;

  const crystalColor = CRYSTAL_COLOR[def.id];
  if (crystalColor) return <CrystalIcon color={crystalColor} />;

  const regionalTier = regionalTierOf(def.id);
  if (regionalTier) return <RegionalTierIcon tier={regionalTier} />;

  // 成品模组各有专属徽记与配色(见 moduleGlyphs), 不跟随稀有度 currentColor;
  // 未登记徽记的模组继续走下面的通用 ModuleIcon。
  if (def.category === "module" && hasModuleGlyph(def.id)) return <ModuleGlyph moduleId={def.id} />;

  const key = def.icon ?? BY_CATEGORY[def.category];
  const Icon = ICONS[key] ?? ICONS[BY_CATEGORY[def.category]];
  return <Icon />;
}
