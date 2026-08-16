// 事件图标 —— 画在**直立投影面板**上的一组纯线框符号。
//
// ⛔ 一律 2D 线框, 不做任何等距斜切: 这些图标不在地面上, 而是在一块正对观者的投影面上,
//   跟着面板一起「立」着 —— 一旦给它们加斜切, 面板就会读成又一块躺倒的贴纸。
// ★ 全部用 currentColor 描边 ⇒ 颜色由面板上的 color(事件色派生的 --k1)统一给,
//   新增事件类型只要补一条 path, 不用再碰任何颜色。
// ⚠ 统一 viewBox 32×32、stroke-width 2、round 端点: 25 块砖同时在画面上, 线宽不齐会立刻看出来。

import type { ReactElement } from "react";
import type { NodeEventKind } from "@/explore/types";

const PATHS: Record<NodeEventKind, ReactElement> = {
  // 补给箱: 箱体 + 盖缝 + 锁扣
  loot: (
    <>
      <path d="M5 11h22v15H5z" />
      <path d="M5 16h22" />
      <path d="M14 16v4h4v-4" />
      <path d="M8 11l3-5h10l3 5" />
    </>
  ),
  // 治疗: 医疗十字 + 外圈
  heal: (
    <>
      <path d="M16 8v16M8 16h16" />
      <path d="M11 6h10v20H11z" />
    </>
  ),
  // 交易: 提袋 + 提手
  merchant: (
    <>
      <path d="M7 12h18l-2 15H9z" />
      <path d="M12 12V9a4 4 0 0 1 8 0v3" />
    </>
  ),
  // 线路分配: 一条主线在中途分出两支
  route: (
    <>
      <path d="M16 27V16" />
      <path d="M16 16 7 9M16 16l9-7" />
      <path d="M7 5v4h4M25 5v4h-4" />
    </>
  ),
  // 净化粒子: 闪电
  energy: <path d="M18 4 8 18h7l-1 10 10-14h-7z" />,
  // 危险: 三角警示 + 感叹号
  hazard: (
    <>
      <path d="M16 5 29 27H3z" />
      <path d="M16 13v7M16 23.5v.5" />
    </>
  ),
  // 战斗: 交叉的两把刃
  battle: (
    <>
      <path d="M6 6l14 14M26 6 12 20" />
      <path d="M20 20l6 6M12 20l-6 6" />
      <path d="M4 24h4v4H4zM24 24h4v4h-4z" />
    </>
  ),
  // 撤离: 门框 + 向外的箭头
  retreat: (
    <>
      <path d="M8 5h10v22H8z" />
      <path d="M18 16h9M23 12l4 4-4 4" />
    </>
  ),
};

export function QwenEventIcon({ kind, className }: { kind: NodeEventKind; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[kind]}
    </svg>
  );
}
