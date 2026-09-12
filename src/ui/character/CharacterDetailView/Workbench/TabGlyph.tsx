// 工作区页签前缀的装饰图标 —— 参考稿上两个页签各带一枚发光晶体。
//
// ★ 旧版用 "✦" / "◈" 两个字符: 字形随字体走, 参考稿那种「四角星带细长光芒」画不出来,
//   且字符本身吃基线, 与标签对齐要靠 line-height 反复试。改成内联 SVG 后两者都解决。
// ★ 只有两枚, 不进 StatIcon 那张大表 —— 它是属性图标的真相点, 装饰符号不混进去。
// ⚠ 发光交给 CSS(.tab-glyph 的 filter 只在选中态那一枚上), 这里不带任何滤镜。

const SVG_PROPS = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true as const,
};

/** 属性装备页: 四角星晶体, 纵向光芒更长。 */
export function TabGlyphStar({ className }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className}>
      <path d="m12 1 3 7 6 4-6 3-3 8-3-8-6-3 6-4Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="m12 2 1 9 7 1-7 1-1 10-1-10-7-1 7-1Z" />
      <path d="m7 6 10 12M17 6 7 18" fill="none" stroke="currentColor" strokeWidth=".8" />
    </svg>
  );
}

/** 卡组页: 双层菱形。 */
export function TabGlyphDiamond({ className }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className}>
      <path d="M12 1.2 22.8 12 12 22.8 1.2 12Z" opacity="0.4" />
      <path d="M12 6.2 17.8 12 12 17.8 6.2 12Z" />
    </svg>
  );
}

/** 页签条右端的三重箭头 —— 稿子上是三枚渐亮的 V, 不是 » 字符。 */
export function TabChevrons({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 22" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 4 12 11 4 18" opacity="0.42" />
      <path d="M17 4 25 11 17 18" opacity="0.72" />
      <path d="M30 4 38 11 30 18" />
    </svg>
  );
}
