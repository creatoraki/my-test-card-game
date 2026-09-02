import type { CSSProperties, ReactNode } from "react";
import {
  AssemblyIcon,
  CryoIcon,
  FormationIcon,
  MuseumIcon,
  ShopIcon,
  SortieIcon,
  StorageIcon,
  TrainingIcon,
  WorkOrderIcon,
} from "./facilityIcons";

export interface FacilityBrick {
  col: number;
  colEnd: number;
  row: number;
  rowEnd: number;
  lift: number;
}

export interface TownFacility {
  id: string;
  name: string;
  icon: ReactNode;
  brick: FacilityBrick;
  size: "lg" | "md";
  inline?: boolean;
  locked?: boolean;
  kind?: "scene" | "screen";
}

// 想调整据点入口的拼法时只改这里，数组顺序同时决定飞出次序。
export const TOWN_FACILITIES: TownFacility[] = [
  {
    id: "training",
    name: "训练室",
    icon: <TrainingIcon />,
    brick: { col: 1, colEnd: 6, row: 1, rowEnd: 3, lift: 24 },
    size: "lg",
  },
  {
    id: "formation",
    name: "编队",
    icon: <FormationIcon />,
    brick: { col: 6, colEnd: 10, row: 1, rowEnd: 2, lift: 10 },
    size: "md",
    kind: "screen",
  },
  {
    id: "sortie",
    name: "出击",
    icon: <SortieIcon />,
    brick: { col: 10, colEnd: 13, row: 1, rowEnd: 4, lift: 30 },
    size: "lg",
    kind: "screen",
  },
  {
    id: "assembly",
    name: "模块装配舱",
    icon: <AssemblyIcon />,
    brick: { col: 6, colEnd: 10, row: 2, rowEnd: 3, lift: 4 },
    size: "md",
    inline: true,
  },
  {
    id: "cryo",
    name: "冬眠仓",
    icon: <CryoIcon />,
    brick: { col: 1, colEnd: 5, row: 3, rowEnd: 4, lift: 16 },
    size: "md",
  },
  {
    id: "worklog",
    name: "控制终端",
    icon: <WorkOrderIcon />,
    brick: { col: 5, colEnd: 10, row: 3, rowEnd: 4, lift: 8 },
    size: "md",
  },
  {
    id: "storage",
    name: "物资中转仓",
    icon: <StorageIcon />,
    brick: { col: 1, colEnd: 4, row: 4, rowEnd: 5, lift: 12 },
    size: "md",
  },
  {
    id: "shop",
    name: "商店",
    icon: <ShopIcon />,
    brick: { col: 4, colEnd: 8, row: 4, rowEnd: 5, lift: 20 },
    size: "md",
  },
  {
    id: "museum",
    name: "博物馆",
    icon: <MuseumIcon />,
    brick: { col: 8, colEnd: 13, row: 4, rowEnd: 5, lift: 2 },
    size: "md",
  },
];

export function brickStyle(brick: FacilityBrick, borderRadius: number): CSSProperties {
  return {
    gridColumn: `${brick.col} / ${brick.colEnd}`,
    gridRow: `${brick.row} / ${brick.rowEnd}`,
    "--brick-radius": `${borderRadius}px`,
  };
}
