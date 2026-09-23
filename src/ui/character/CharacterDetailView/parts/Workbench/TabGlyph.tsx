// 工作区页签前缀的装饰图标 + 页签条左上角的弧线框饰 —— 三者都按美术稿逐像素复刻。
//
// ★ 稿子实测(稿 442×72, 换算比 0.75 → 设计 px): 星形是**竖长**的四角星(31×45),
//   腰线在 45.6% 高度, 下方还挂两条向内弯的弧翼, 横臂上方另有两枚小点;
//   菱形则是**空心描边**套一枚实心小菱形, 不是半透明实块。
// ★ 两枚 tab glyph 统一用 46 高的 viewBox(宽度各自不同), CSS 那边只写一条
//   `height: 46px; width: auto` 就能让两者同高而各自保宽。
// ★ 只有这几枚, 不进 StatIcon 那张大表 —— 它是属性图标的真相点, 装饰符号不混进去。
// ⚠ 发光交给 CSS(.tab-glyph / .head-corner 的 filter), 这里不带任何滤镜。

/** 属性装备页: 竖长四角星晶体, 下挂双弧翼。 */
export function TabGlyphStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 46" fill="none" className={className} aria-hidden="true">
      {/* 主体: 上下尖 (16,0)/(16,46), 横臂 (0,21)/(32,21), 腰部半宽 3、横臂半厚 2.7。 */}
      <path
        fill="currentColor"
        d="M16 0c.6 8 1 15 2.6 19.5 3.4.9 8.4 1.3 13.4 1.5-5 .3-10 .8-13.4 1.7C17 27.5 16.6 37 16 46c-.6-9-1-18.5-2.6-23.3-3.4-.9-8.4-1.4-13.4-1.7 5-.2 10-.6 13.4-1.5C15 15 15.4 8 16 0Z"
      />
      {/* 下方双弧翼: 从横臂两端向内下弯, 汇到竖轴下部。 */}
      <path
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M0 21.5C.8 28 4 34 14.5 37.5M32 21.5c-.8 6.5-4 12.5-14.5 16"
      />
      {/* 横臂上方两枚小点。 */}
      <path fill="currentColor" d="m8.2 9.2 1.4 1.4-1.4 1.4-1.4-1.4zM24.2 9.2l1.4 1.4-1.4 1.4-1.4-1.4z" />
    </svg>
  );
}

/** 卡组页: 空心菱形套一枚实心小菱形。 */
export function TabGlyphDiamond({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 29 46" fill="none" className={className} aria-hidden="true">
      <path d="M14.5 9.5 26 23 14.5 36.5 3 23Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14.5 18 20 23l-5.5 5L9 23Z" fill="currentColor" />
    </svg>
  );
}

/** 页签条左上角的细弧线 —— 稿子上整条框饰只有这一笔, 沿着 19px 切角走。 */
export function HeadCornerArc({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 36" fill="none" className={className} aria-hidden="true">
      <path d="M18 3C10 8 4 16 3 30" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
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
