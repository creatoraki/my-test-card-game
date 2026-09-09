interface GlyphProps {
  className?: string;
}

const glyphBase = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** 三层货架与扩容加号。作为 SVG 的 g 子节点嵌入科技树。 */
export function ShelfPlusGlyph({ className }: GlyphProps) {
  return (
    <g className={className} {...glyphBase}>
      <path d="M5 12h27M5 22h27M5 32h27" />
      <path d="M8 13v8M29 13v8M8 23v8M29 23v8" opacity=".55" />
      <path d="M36 5v10M31 10h10" />
    </g>
  );
}

/** 循环箭头与补货箱。作为 SVG 的 g 子节点嵌入科技树。 */
export function SupplyLoopGlyph({ className }: GlyphProps) {
  return (
    <g className={className} {...glyphBase}>
      <path d="M8 18a12 12 0 0 1 20-7l3 3" />
      <path d="m31 8 1 6-6-1" />
      <path d="M32 30a12 12 0 0 1-20 7l-3-3" />
      <path d="m9 40-1-6 6 1" />
      <rect x="14" y="17" width="20" height="14" rx="1" />
      <path d="M14 22h20M20 17v14M28 17v14" opacity=".55" />
    </g>
  );
}
