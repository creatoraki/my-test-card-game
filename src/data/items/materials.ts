import type { ItemDef } from "../../items/types";
import { withBuyValue } from "./pricing";

// ============================================================================
// 材料表 —— 掉落物只分三类, 本文件负责其中两类(第三类换金物见 ./scrap.ts):
//   ① 通用材料(魔方/齿轮/电池/弹簧/磁铁): 怪物与事件产出, 用于制造模组与装备养成。可上架据点商店。
//   ② 水晶(绿/蓝/红): 按敌人档位掉落(小怪/精英/首领), 回城升级建筑。
//
// ★ 水晶**刻意不过 withBuyValue** ⇒ 没有 buyValue ⇒ data/shop.ts 的候选池
//   (筛选条件是「填了 buyValue」)自然把它排除, 不需要再写一张黑名单。
//   同理不写 sellValue ⇒ 回收台不收水晶。
// ============================================================================

const GENERAL_DEFS: ItemDef[] = [
  {
    id: "logic-cube",
    name: "魔方",
    category: "material",
    rarity: "common",
    desc: "可重写的标准逻辑单元，用于逻辑、控制、识别和模组接口的基础加工。",
    maxStack: 1,
    icon: "material",
  },
  {
    id: "standard-gear",
    name: "齿轮",
    category: "material",
    rarity: "common",
    desc: "城市机械普遍采用的标准传动件，用于结构、传动和维修加工。",
    maxStack: 1,
    icon: "material",
  },
  {
    id: "standard-battery",
    name: "电池",
    category: "material",
    rarity: "common",
    desc: "多数旧设备都能读取的标准储能单元，用于供能、启动和应急加工。",
    maxStack: 1,
    icon: "material",
  },
  {
    id: "coil-spring",
    name: "弹簧",
    category: "material",
    rarity: "common",
    desc: "标准弹性储能件，用于缓冲、复位和承压结构的基础加工。",
    maxStack: 1,
    icon: "material",
  },
  {
    id: "magnet",
    name: "磁铁",
    category: "material",
    rarity: "common",
    desc: "稳定的永磁单元，用于吸附、分拣和磁性驱动的基础加工。",
    maxStack: 1,
    icon: "material",
  },
];

// 水晶没有品级 —— 三种同为 common, 颜色是它们唯一的区分信息(图标固定取色, 不随稀有度)。
const CRYSTAL_DEFS: ItemDef[] = [
  {
    id: "green-crystal",
    name: "绿色水晶",
    category: "material",
    rarity: "common",
    desc: "从普通机械单元核心中析出的绿色结晶，带回据点用于升级建筑和装备养成。不参与模组制造，回收台不收。",
    maxStack: 1,
    icon: "material",
  },
  {
    id: "blue-crystal",
    name: "蓝色水晶",
    category: "material",
    rarity: "common",
    desc: "只在精英级机械体内部成型的蓝色结晶，带回据点用于升级建筑和装备养成。不参与模组制造，回收台不收。",
    maxStack: 1,
    icon: "material",
  },
  {
    id: "red-crystal",
    name: "红色水晶",
    category: "material",
    rarity: "common",
    desc: "首领级机械体的能量炉残留物，带回据点用于升级建筑和装备养成。不参与模组制造，回收台不收。",
    maxStack: 1,
    icon: "material",
  },
];

// 商店挂牌价统一打标(见 ./pricing.ts)。
export const GENERAL_MATERIAL_DEFS: ItemDef[] = withBuyValue(GENERAL_DEFS);
export const CRYSTAL_ITEM_DEFS: ItemDef[] = CRYSTAL_DEFS;

export const MATERIAL_ITEM_DEFS: ItemDef[] = [...GENERAL_MATERIAL_DEFS, ...CRYSTAL_ITEM_DEFS];
