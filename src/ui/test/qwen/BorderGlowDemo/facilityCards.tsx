import type { CSSProperties, ReactNode } from "react";
import {
  AssemblyIcon,
  CryoIcon,
  FormationIcon,
  MedicalIcon,
  ShopIcon,
  SortieIcon,
  StorageIcon,
  TrainingIcon,
  WorkOrderIcon,
} from "./facilityIcons";

// ===================== 卡片数据 =====================
// 砖块几何（brick）直接挂在卡片上，而不是另开一张 id → 跨格 的映射表：
// 映射表一旦漏掉某个 id 就会静默退化成自动排布（九块挤成一行），
// 写进卡片则由类型强制每块都有几何，漏写直接编译报错。

/** 砖块在 12 微列 × 4 行底板上的占位，数值是网格线号（含头不含尾） */
export interface FacilityBrick {
  /** 起始列线 1-12 */
  col: number;
  /** 结束列线 2-13 */
  colEnd: number;
  /** 起始行线 1-4 */
  row: number;
  /** 结束行线 2-5 */
  rowEnd: number;
  /** 砖块离墙的高度（px）：越大越靠前、投影越散越深，九块高低不一才有积木感 */
  lift: number;
}

export interface FacilityCard {
  /** 与 TownScreen 的 FACILITIES id 一致 */
  id: string;
  name: string;
  icon: ReactNode;
  brick: FacilityBrick;
  /** 卡面尺度档位：跟着砖块面积走，只影响图标与名称的大小 */
  size: "lg" | "md" | "sm";
  /** 矮砖竖着堆图标与名称会挤，改成横排（图标在左、名称在右） */
  inline?: boolean;
  /** 未开放占位：降亮 + 「未开放」小标 */
  locked?: boolean;
}

// 拼法（12 微列 × 4 行，九块严丝合缝铺满，外轮廓是规则矩形）：
//   行 1 |   训练室 1-6   |   编队 6-10   |          |
//   行 2 |  （训练室续）   | 装配舱 6-10   |  出击     |
//   行 3 | 冬眠 1-5 | 控制终端 5-10       |  10-13    |
//   行 4 | 中转 1-4 | 商店 4-8 |   生物维护舱 8-13    |
// 竖缝逐行错开（6/10 → 6/10 → 5/10 → 4/8），行高也刻意不等，
// 拼出俄罗斯方块的参差感，而不是工整九宫格。
export const FACILITY_CARDS: FacilityCard[] = [
  { id: "training", name: "训练室", icon: <TrainingIcon />, brick: { col: 1, colEnd: 6, row: 1, rowEnd: 3, lift: 24 }, size: "lg" },
  { id: "formation", name: "编队", icon: <FormationIcon />, brick: { col: 6, colEnd: 10, row: 1, rowEnd: 2, lift: 10 }, size: "md" },
  { id: "sortie", name: "出击", icon: <SortieIcon />, brick: { col: 10, colEnd: 13, row: 1, rowEnd: 4, lift: 30 }, size: "lg" },
  {
    id: "assembly",
    name: "模块装配舱",
    icon: <AssemblyIcon />,
    brick: { col: 6, colEnd: 10, row: 2, rowEnd: 3, lift: 4 },
    size: "md",
    inline: true,
  },
  { id: "cryo", name: "冬眠仓", icon: <CryoIcon />, brick: { col: 1, colEnd: 5, row: 3, rowEnd: 4, lift: 16 }, size: "md" },
  { id: "worklog", name: "控制终端", icon: <WorkOrderIcon />, brick: { col: 5, colEnd: 10, row: 3, rowEnd: 4, lift: 8 }, size: "md" },
  { id: "storage", name: "物资中转仓", icon: <StorageIcon />, brick: { col: 1, colEnd: 4, row: 4, rowEnd: 5, lift: 12 }, size: "md" },
  { id: "shop", name: "商店", icon: <ShopIcon />, brick: { col: 4, colEnd: 8, row: 4, rowEnd: 5, lift: 20 }, size: "md" },
  {
    id: "medical",
    name: "生物维护舱",
    icon: <MedicalIcon />,
    brick: { col: 8, colEnd: 13, row: 4, rowEnd: 5, lift: 2 },
    size: "md",
    locked: true,
  },
];

/**
 * 砖块几何 → 网格项内联样式。
 * 除跨格外还带出两个 CSS 变量：--brick-lift 决定它离墙多高（缩放 + 投影强弱），
 * --brick-radius 让投影的圆角跟着卡面圆角滑杆走，投影才不会露出方角。
 */
export function brickStyle(brick: FacilityBrick, borderRadius: number): CSSProperties {
  return {
    gridColumn: `${brick.col} / ${brick.colEnd}`,
    gridRow: `${brick.row} / ${brick.rowEnd}`,
    "--brick-lift": brick.lift,
    "--brick-radius": `${borderRadius}px`,
  } as CSSProperties;
}
