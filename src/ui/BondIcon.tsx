import type { ReactNode } from "react";

const SVG_PROPS = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// 羁绊图标统一使用 48×48 的简约线框, 由父级 color 决定黑白/强调色。
const ICONS: Record<string, () => ReactNode> = {
  // 力量: 握紧的拳头
  strength: () => (
    <>
      <path d="M14 28v-8c0-2 1-3 3-3s3 1 3 3v-5c0-2 1-3 3-3s3 1 3 3v5-7c0-2 1-3 3-3s3 1 3 3v8-5c0-2 1-3 3-3s3 1 3 3v10c0 8-5 12-12 12h-2c-6 0-10-4-10-10Z" strokeWidth={1.8} />
    </>
  ),
  // 战车: 车轮与前进箭头
  chariot: () => (
    <>
      <circle cx="18" cy="28" r="10" strokeWidth={1.8} />
      <path d="M18 18V10h22M40 10l-6-6M40 10l-6 6M18 28h22" strokeWidth={1.8} />
    </>
  ),
  // 审判: 号角与声波
  judgement: () => (
    <>
      <path d="M10 22h9l16-7v18l-16-7h-9Z" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M38 19c3 2 3 8 0 10M42 15c6 4 6 14 0 18" strokeWidth={1.8} />
    </>
  ),
  // 女祭司: 帷幕与月牙
  priestess: () => (
    <>
      <path d="M13 39V16c4 4 8 4 11 0 3 4 7 4 11 0v23" strokeWidth={1.8} />
      <path d="M29 9a8 8 0 1 0 6 12 7 7 0 1 1-6-12Z" strokeWidth={1.8} />
    </>
  ),
  // 高塔: 塔身与闪电
  tower: () => (
    <>
      <path d="M15 40h18l-3-25H18Z" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M14 15h20l-4-6H18ZM26 4l-6 11h6l-3 9 9-13h-6Z" strokeWidth={1.8} strokeLinejoin="round" />
    </>
  ),
  // 愚者: 旅人与手杖
  fool: () => (
    <>
      <circle cx="17" cy="12" r="4" strokeWidth={1.8} />
      <path d="M17 16c-3 5-3 10 0 15l-3 9M17 31l8 8M17 22l8-4M29 8v31M29 8l7 7" strokeWidth={1.8} />
    </>
  ),
};

// 未登记的后续羁绊使用中性环徽, 避免新内容在 UI 中出现空白。
function FallbackBondIcon() {
  return (
    <>
      <circle cx="24" cy="24" r="14" strokeWidth={1.2} opacity={0.45} />
      <path d="M16 24c0-5 3-8 8-8s8 3 8 8-3 8-8 8-8-3-8-8ZM24 10v6M24 32v6" strokeWidth={1.6} />
    </>
  );
}

export function BondIcon({
  bondId,
  title,
  className,
}: {
  bondId: string;
  title?: string;
  className?: string;
}) {
  const Icon = ICONS[bondId] ?? FallbackBondIcon;
  return (
    <svg
      {...SVG_PROPS}
      className={className}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      <Icon />
    </svg>
  );
}