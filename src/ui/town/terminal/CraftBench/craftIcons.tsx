// 制造详情专用图标: 经验方块 / 制造按钮徽标 / 按钮右侧双箭头。颜色均可由外层 CSS 覆盖。

/** 「经验」行图标 —— 等轴方块, 三个面分层着色, 顶面嵌一枚菱形刻印。 */
export function ExpIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 5 41 14.5v19L24 43 7 33.5v-19Z" fill="#2c3a33" />
      <path d="M24 5 41 14.5 24 24 7 14.5Z" fill="#cfe3d6" />
      <path d="M7 14.5 24 24v19L7 33.5Z" fill="#8fae9b" />
      <path d="M41 14.5 24 24v19l17-9.5Z" fill="#5f8070" />
      <path d="M24 9.5 30 13l-6 3.5-6-3.5Z" fill="#3f5c4c" />
      <path d="M13 22.5 18.5 25.5v6L13 28.5ZM35 22.5l-5.5 3v6l5.5-3Z" fill="#2a3d33" opacity=".8" />
      <path d="M24 5 41 14.5v19L24 43 7 33.5v-19Z" stroke="#e8f4ec" strokeWidth="1.2" strokeLinejoin="round" opacity=".7" />
    </svg>
  );
}

/** 制造按钮左侧的研究中心三角徽标: 红色粗三角 + 内部白色折线。 */
export function CraftEmblem() {
  return (
    <svg viewBox="0 0 48 44" fill="none" aria-hidden="true">
      <path d="M24 4 44 40H4Z" stroke="currentColor" strokeWidth="5" strokeLinejoin="miter" />
      <path d="M17 33 26 18l6 10.5H22" stroke="#fff" strokeWidth="3.4" strokeLinejoin="miter" />
    </svg>
  );
}

/** 按钮右侧的双箭头。 */
export function ChevronsIcon() {
  return (
    <svg viewBox="0 0 36 30" fill="none" stroke="currentColor" strokeWidth="3.6" aria-hidden="true">
      <path d="m4 3 12 12L4 27M19 3l12 12-12 12" />
    </svg>
  );
}
