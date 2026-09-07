// 抽屉入口图标。与 ui/art/itemArt.tsx 同约定: 内联线框 SVG, 不用 emoji、不依赖素材。
const iconBase = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** 库存清单: 堆叠的货箱 */
export const CrateIcon = () => (
  <svg {...iconBase}>
    <rect x="5" y="14" width="22" height="13" rx="1" />
    <path d="M5 19 h22" opacity=".6" />
    <path d="M13 14 v13 M19 14 v13" opacity=".45" />
    <rect x="10" y="6" width="12" height="8" rx="1" opacity=".7" />
  </svg>
);

/** 回收台: 三角循环箭头 */
export const RecycleIcon = () => (
  <svg {...iconBase}>
    <path d="M16 5 L21 14 h-10 Z" />
    <path d="M8 18 L3 27 h10 Z" opacity=".75" />
    <path d="M24 18 L29 27 H19 Z" opacity=".75" />
    <path d="M13 27 h6" opacity=".5" />
  </svg>
);
