// 研究中心导航图标：48 坐标系线条风格，颜色取 currentColor（常态浅灰、选中态主题红）。
// viewBox 按设计稿收紧到各图形外框，使 34px 图标盒内的图形尺寸与设计稿一致。
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** 「模组装配」入口图标 —— 芯片：外框 + 四边引脚 + 内核圆角方块。 */
export function AssemblyIcon() {
  return (
    <svg viewBox="6.5 6.5 35 35" {...STROKE}>
      <rect x="13" y="13" width="22" height="22" rx="1" />
      <rect x="19" y="19" width="10" height="10" rx="3" />
      <path d="M18 7v3M24 7v3M30 7v3M18 38v3M24 38v3M30 38v3M7 18h3M7 24h3M7 30h3M38 18h3M38 24h3M38 30h3" strokeWidth="2.2" />
    </svg>
  );
}

/** 「模组制造」入口图标 —— 带夹口的烧瓶 + 内部循环箭头。 */
export function CraftIcon() {
  return (
    <svg viewBox="6 6 36 36" {...STROKE}>
      <path d="M14 7h20M14 7v3M34 7v3" />
      <path d="M19 10v8L9 37.5a2.2 2.2 0 0 0 2 3.5h26a2.2 2.2 0 0 0 2-3.5L29 18v-8" />
      <path d="M19.5 31a5 5 0 0 1 8.2-4.4M28.5 32a5 5 0 0 1-8.2 4.4" strokeWidth="2" />
      <path d="M27.7 23.6v3h-3M20.3 39.4v-3h3" strokeWidth="2" />
    </svg>
  );
}

/** 「科技树」入口图标 —— 三节点：顶部根节点分叉到两个底部节点，底部横向相连。 */
export function TechTreeIcon() {
  return (
    <svg viewBox="3 3 42 42" {...STROKE}>
      <circle cx="24" cy="10.5" r="4.5" />
      <circle cx="11.5" cy="35.5" r="4.5" />
      <circle cx="36.5" cy="35.5" r="4.5" />
      <path d="M24 15v9M24 24l-9.2 8.3M24 24l9.2 8.3M16 35.5h16" />
    </svg>
  );
}
