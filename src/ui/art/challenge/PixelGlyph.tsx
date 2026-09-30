import { useId, useMemo } from "react";
import type { Px } from "./pixel/PixelCanvas";

/** 打破时的裂痕: 自上而下的折线像素格 [列, 行], 基于 32 格画布。 */
const CRACK_CELLS: [number, number][] = [
  [18, 0], [18, 1], [17, 2], [17, 3], [16, 4], [16, 5], [15, 6], [16, 7], [17, 8], [17, 9],
  [16, 10], [15, 11], [14, 12], [14, 13], [15, 14], [16, 15], [16, 16], [15, 17], [14, 18],
  [13, 19], [13, 20], [14, 21], [14, 22], [13, 23], [12, 24], [12, 25], [11, 26], [11, 27],
  [12, 28], [12, 29], [11, 30], [11, 31],
];
const CRACK_PATH = CRACK_CELLS.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join("");

/** 打破态去色: 按亮度映射到暖灰, 保留明暗层次。 */
function desaturate(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  const v = Math.round(40 + lum * 90);
  return `rgb(${v + 6},${v},${v - 4})`;
}

/** 同色像素按行合并成横向色块, 每种颜色输出一条 path。 */
function gridToLayers(grid: readonly Px[], size: number): [string, string][] {
  const layers = new Map<string, string>();
  for (let y = 0; y < size; y += 1) {
    let x = 0;
    while (x < size) {
      const color = grid[y * size + x];
      if (!color) { x += 1; continue; }
      const start = x;
      while (x < size && grid[y * size + x] === color) x += 1;
      layers.set(color, `${layers.get(color) ?? ""}M${start} ${y}h${x - start}v1h${start - x}z`);
    }
  }
  return [...layers];
}

interface PixelGlyphProps {
  grid: readonly Px[];
  /** 网格边长(像素数), 画布恒为 1:1。 */
  gridSize: number;
  /** 渲染边长(CSS 像素), 取 gridSize 的整数倍最清晰。 */
  size: number;
  broken?: boolean;
  className?: string;
}

export function PixelGlyph({ grid, gridSize, size, broken = false, className }: PixelGlyphProps) {
  const layers = useMemo(() => gridToLayers(grid, gridSize), [grid, gridSize]);
  const maskId = `crack${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {broken && (
        <mask id={maskId}>
          <rect width={gridSize} height={gridSize} fill="#fff" />
          <path d={CRACK_PATH} fill="#000" />
        </mask>
      )}
      <g mask={broken ? `url(#${maskId})` : undefined}>
        {layers.map(([color, d]) => (
          <path key={color} d={d} fill={broken ? desaturate(color) : color} />
        ))}
      </g>
    </svg>
  );
}
