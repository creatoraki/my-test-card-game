// 据点终端面板里的小图标。线条一律 currentColor, 由各自的芯片染色。

import type { ReactNode } from "react";

export type HudGlyphName = "credit" | "crystal" | "party" | "roster" | "pod" | "font" | "fallen";

const PATHS: Record<HudGlyphName, ReactNode> = {
  // 积分: 六边形芯片 + 中心刻痕
  credit: (
    <>
      <path d="M12 2.5 L20.5 7.25 V16.75 L12 21.5 L3.5 16.75 V7.25 Z" />
      <path d="M9 9.5 H15 M9 12 H15 M9 14.5 H13" />
    </>
  ),
  // 水晶: 切面棱柱
  crystal: (
    <>
      <path d="M12 2.5 L18 8 L12 21.5 L6 8 Z" />
      <path d="M6 8 H18 M12 2.5 L10 8 L12 21.5 L14 8 Z" />
    </>
  ),
  // 上阵: 交叉双剑
  party: (
    <>
      <path d="M5 4 L15 14 M19 4 L9 14" />
      <path d="M13 16 L16 13 M11 16 L8 13 M16.5 17.5 L19 20 M7.5 17.5 L5 20" />
    </>
  ),
  // 在编: 两个人像
  roster: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19 C3.5 15 6 13.2 9 13.2 C12 13.2 14.5 15 14.5 19" />
      <path d="M15.5 5.2 A3 3 0 1 1 15.5 11 M17 13.6 C19.2 14.2 20.5 16 20.5 19" />
    </>
  ),
  // 疗养: 胶囊舱 + 十字
  pod: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="8" />
      <path d="M12 8.5 V15.5 M8.5 12 H15.5" />
    </>
  ),
  // 圣水池: 水滴 + 波纹
  font: (
    <>
      <path d="M12 3 C15 7 17 9.6 17 12.5 A5 5 0 0 1 7 12.5 C7 9.6 9 7 12 3 Z" />
      <path d="M4 20 C6 18.8 8 18.8 10 20 C12 21.2 14 21.2 16 20 C17.4 19.2 18.8 19 20 19.6" />
    </>
  ),
  // 阵亡: 断裂的心电线
  fallen: (
    <>
      <path d="M3 12 H8 L10 7 L13 17 L15 12 H21" />
      <path d="M17 5 L20 8 M20 5 L17 8" />
    </>
  ),
};

export function HudGlyph({ name, className }: { name: HudGlyphName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
