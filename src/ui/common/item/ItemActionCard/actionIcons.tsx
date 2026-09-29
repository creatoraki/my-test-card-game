// 物品操作按钮的小图标(内联 SVG, stroke = currentColor, 跟随按钮色调)。

import type { ReactNode } from "react";

export type ActionIconName = "use" | "open" | "install" | "discard" | "take" | "confirm" | "close";

const PATHS: Record<ActionIconName, ReactNode> = {
  // 使用: 闪电
  use: <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" />,
  // 拆箱: 掀开的箱盖
  open: (
    <>
      <path d="M4 11h16v9H4z" />
      <path d="M4 11 7 5h10l3 6" />
      <path d="M10 15h4" />
    </>
  ),
  // 装载: 芯片 + 插针
  install: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
    </>
  ),
  // 丢弃: 垃圾桶
  discard: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </>
  ),
  // 拾取: 向下收纳
  take: (
    <>
      <path d="M12 3v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  confirm: <path d="m5 12 5 5 9-10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

export function ActionIcon({ name, className }: { name: ActionIconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
