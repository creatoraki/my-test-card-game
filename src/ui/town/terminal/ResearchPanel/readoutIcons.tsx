// 研究中心页眉读数图标: 36 坐标系细线风格, 颜色取 currentColor。
const LINE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinejoin: "round",
  strokeLinecap: "round",
  "aria-hidden": true,
} as const;

/** 终端积分 —— 竖向多面晶体: 外轮廓 + 内嵌菱形刻面。 */
export function CreditIcon() {
  return (
    <svg viewBox="0 0 36 36" {...LINE}>
      <path d="M18 2.5 27.5 10v16L18 33.5 8.5 26V10Z" />
      <path d="M18 8.5 23 13.5v9L18 27.5 13 22.5v-9Z" />
      <path d="M18 2.5v6M18 27.5v6M8.5 10l4.5 3.5M27.5 10 23 13.5M8.5 26l4.5-3.5M27.5 26 23 22.5" strokeWidth="1.2" />
    </svg>
  );
}

/** 库存模组 —— 等轴立方体, 两个侧面各嵌一块小方格。 */
export function StockIcon() {
  return (
    <svg viewBox="0 0 36 36" {...LINE}>
      <path d="M18 3 31.5 10.5v15L18 33 4.5 25.5v-15Z" />
      <path d="M4.5 10.5 18 18l13.5-7.5M18 18v15" />
      <path d="M8.5 16.5 14 19.5v6L8.5 22.5ZM27.5 16.5 22 19.5v6l5.5-3Z" strokeWidth="1.3" />
    </svg>
  );
}

/** 已装配 —— 立方体三面各缀圆点, 像一枚骰子。 */
export function InstalledIcon() {
  return (
    <svg viewBox="0 0 36 36" {...LINE}>
      <path d="M18 3 31.5 10.5v15L18 33 4.5 25.5v-15Z" />
      <path d="M4.5 10.5 18 18l13.5-7.5M18 18v15" />
      <g fill="currentColor" stroke="none">
        <circle cx="18" cy="10.5" r="1.6" />
        <circle cx="9" cy="17.5" r="1.4" />
        <circle cx="13" cy="25" r="1.4" />
        <circle cx="25" cy="18.5" r="1.4" />
        <circle cx="27" cy="23.5" r="1.4" />
        <circle cx="23" cy="26" r="1.4" />
      </g>
    </svg>
  );
}
