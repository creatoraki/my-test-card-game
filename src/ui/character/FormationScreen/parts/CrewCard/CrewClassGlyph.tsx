// 编队卡名牌上方的职业徽记。线条走 currentColor, 由名牌统一染成角色色。
// 未登记的角色用通用菱形徽记兜底。

import type { ReactNode } from "react";

const GLYPHS: Record<string, ReactNode> = {
  // 剑士: 竖剑 + 护手 + 两翼
  swordsman: (
    <>
      <path d="M20 4 L23 10 L23 26 L17 26 L17 10 Z" />
      <path d="M11 26 H29 M20 26 V34 M17 34 H23" />
      <path d="M8 14 L14 20 M32 14 L26 20" />
    </>
  ),
  // 预言家: 占卜球 + 星芒 + 底座
  prophet: (
    <>
      <circle cx="20" cy="17" r="9" />
      <path d="M20 12 L21.4 15.6 L25 17 L21.4 18.4 L20 22 L18.6 18.4 L15 17 L18.6 15.6 Z" />
      <path d="M12 30 H28 L25 26 H15 Z" />
      <path d="M8 8 L10 10 M32 8 L30 10" />
    </>
  ),
  // 植物学家: 三叶新芽
  botanist: (
    <>
      <path d="M20 34 V16" />
      <path d="M20 16 C20 10 24 6 29 5 C29 11 25 15 20 16 Z" />
      <path d="M20 22 C20 17 15 13 10 13 C10 18 14 22 20 22 Z" />
      <path d="M13 34 H27" />
    </>
  ),
  // 炼金术士: 锥形烧瓶 + 气泡
  alchemist: (
    <>
      <path d="M16 5 H24 M17 5 V15 L9 31 Q8 34 11 34 H29 Q32 34 31 31 L23 15 V5" />
      <path d="M12.5 26 H27.5" />
      <circle cx="18" cy="29.5" r="1.4" />
      <circle cx="23" cy="30" r="1" />
    </>
  ),
  // 精算师: 菱形算盘框 + 横档
  actuary: (
    <>
      <path d="M20 4 L34 20 L20 36 L6 20 Z" />
      <path d="M12 15 H28 M10 20 H30 M12 25 H28" />
      <circle cx="16" cy="15" r="1.6" />
      <circle cx="23" cy="20" r="1.6" />
      <circle cx="19" cy="25" r="1.6" />
    </>
  ),
};

const FALLBACK = (
  <>
    <path d="M20 5 L33 20 L20 35 L7 20 Z" />
    <path d="M20 12 L26 20 L20 28 L14 20 Z" />
  </>
);

export function CrewClassGlyph({ charId, className }: { charId: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {GLYPHS[charId] ?? FALLBACK}
    </svg>
  );
}
