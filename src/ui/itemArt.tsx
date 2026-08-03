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
import type { ItemCategory, ItemDef } from "../items/types";
import deflectionBladeArt from "../assets/道具/装备/武器/偏折盾刃.png";
import crossSwordArt from "../assets/道具/装备/武器/十字剑.png";
import dawnSaberArt from "../assets/道具/装备/武器/曙光军刀.png";
import huntingRifleArt from "../assets/道具/装备/武器/猎杀步枪.png";
import glassDaggerArt from "../assets/道具/装备/武器/玻璃匕首.png";
import armorPiercingCrossbowArt from "../assets/道具/装备/武器/穿甲弩.png";
import quickstrikeGauntletArt from "../assets/道具/装备/武器/迅击拳套.png";
import hunterLongbowArt from "../assets/道具/装备/武器/追猎长弓.png";
import heavyCannonArt from "../assets/道具/装备/武器/重型火炮.png";
import shockMaulArt from "../assets/道具/装备/武器/震荡重锤.png";
import cityDefenseHeavyArmorArt from "../assets/道具/装备/防具/城防重甲.png";
import compositeArmorArt from "../assets/道具/装备/防具/复合护甲.png";
import guardPlateArt from "../assets/道具/装备/防具/护卫板甲.png";
import hazmatSuitArt from "../assets/道具/装备/防具/防毒战衣.png";
import mobileArmorArt from "../assets/道具/装备/防具/机动护甲.png";
import bufferCoatArt from "../assets/道具/装备/防具/缓冲外套.png";
import lifeSupportArmorArt from "../assets/道具/装备/防具/生命维持甲.png";
import assaultExoskeletonArt from "../assets/道具/装备/防具/突击外骨骼.png";
import fireControlArmorArt from "../assets/道具/装备/防具/火控战甲.png";
import raiderLightArmorArt from "../assets/道具/装备/防具/破袭轻甲.png";
import polarizedCoreArt from "../assets/道具/装备/饰品/偏振核心.png";
import medicalPendantArt from "../assets/道具/装备/饰品/医疗吊坠.png";
import reactionCharmArt from "../assets/道具/装备/饰品/反应护符.png";
import quickstepWatchArt from "../assets/道具/装备/饰品/急行怀表.png";
import tacticalGogglesArt from "../assets/道具/装备/饰品/战术目镜.png";
import criticalPrismArt from "../assets/道具/装备/饰品/暴击棱镜.png";
import lifeThornRingArt from "../assets/道具/装备/饰品/生命棘环.png";
import breachBeaconArt from "../assets/道具/装备/饰品/破阵信标.png";
import burdenModuleArt from "../assets/道具/装备/饰品/负重模块.png";
import resourceChipArt from "../assets/道具/装备/饰品/资源芯片.png";
import medicalKitArt from "../assets/道具/消耗品/医疗包.png";
import holyWaterArt from "../assets/道具/消耗品/圣水.png";
import fruitJuiceArt from "../assets/道具/消耗品/果汁.png";
import sugarCubeArt from "../assets/道具/消耗品/糖块.png";
import batteryArt from "../assets/道具/材料/通用材料/电池.png";
import cubeArt from "../assets/道具/材料/通用材料/魔方.png";
import gearArt from "../assets/道具/材料/通用材料/齿轮.png";
import lightGuideFilmArt from "../assets/道具/材料/废弃楼层/光导薄膜.png";
import coolingMicrocrystalArt from "../assets/道具/材料/废弃楼层/冷却微晶.png";
import sortingIdChipArt from "../assets/道具/材料/废弃楼层/分拣识别片.png";
import conductiveInkArt from "../assets/道具/材料/废弃楼层/导电印墨.png";
import packagingGelArt from "../assets/道具/材料/废弃楼层/封装凝胶.png";
import broadcastTuningChipArt from "../assets/道具/材料/废弃楼层/广播校频片.png";
import breakerCeramicCoreArt from "../assets/道具/材料/废弃楼层/断路陶芯.png";
import magRailLiningArt from "../assets/道具/材料/废弃楼层/磁轨衬层.png";
import highVoltageInsulatorArt from "../assets/道具/材料/废弃楼层/高压绝缘节.png";

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
  weapon: WeaponIcon,
  armor: ArmorIcon,
  trinket: TrinketIcon,
  data: DataIcon,
  consumable: ConsumableIcon,
};

// 没登记 icon 时按类别兜底 —— 新增物品忘了写 icon 也不会开天窗。
const BY_CATEGORY: Record<ItemCategory, string> = {
  scrap: "scrap",
  material: "material",
  equipment: "armor",
  data: "data",
  consumable: "consumable",
};

const EQUIPMENT_ART: Record<string, string> = {
  "dawn-saber": dawnSaberArt,
  "armor-piercing-crossbow": armorPiercingCrossbowArt,
  "hunting-rifle": huntingRifleArt,
  "quickstrike-gauntlet": quickstrikeGauntletArt,
  "shock-maul": shockMaulArt,
  "cross-sword": crossSwordArt,
  "glass-dagger": glassDaggerArt,
  "heavy-cannon": heavyCannonArt,
  "hunter-longbow": hunterLongbowArt,
  "deflection-blade": deflectionBladeArt,
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
  "resource-chip": resourceChipArt,
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
};

const MATERIAL_ART: Record<string, string> = {
  "logic-cube": cubeArt,
  "standard-gear": gearArt,
  "standard-battery": batteryArt,
  "breaker-ceramic-core": breakerCeramicCoreArt,
  "cooling-microcrystal": coolingMicrocrystalArt,
  "light-guide-film": lightGuideFilmArt,
  "packaging-gel": packagingGelArt,
  "conductive-ink": conductiveInkArt,
  "mag-rail-lining": magRailLiningArt,
  "sorting-id-chip": sortingIdChipArt,
  "high-voltage-insulator": highVoltageInsulatorArt,
  "broadcast-tuning-chip": broadcastTuningChipArt,
};

export function itemIcon(def: ItemDef): ReactNode {
  const art =
    EQUIPMENT_ART[def.id] ??
    (def.familyId ? CONSUMABLE_ART[def.familyId] : undefined) ??
    MATERIAL_ART[def.id];
  if (art) return <img src={art} alt="" />;

  const key = def.icon ?? BY_CATEGORY[def.category];
  const Icon = ICONS[key] ?? ICONS[BY_CATEGORY[def.category]];
  return <Icon />;
}
