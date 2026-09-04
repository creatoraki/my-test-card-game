// 边框角落的像素方块点阵。
//
// 参考截图里左上和右下角各有一片碎方块: 约 4px 的小方块落在 6.5px 的网格上,
// 越靠近角越密、越亮, 往外迅速稀疏。这里不硬编码那上百个坐标(截图里还混着内容像素),
// 而是用同一套网格 + 固定哈希复现这种质感 —— 结果是确定的, 每次渲染完全一致。

export type MosaicCell = { x: number; y: number; size: number; opacity: number };

export type MosaicSpec = {
  /** 网格间距。 */
  pitch: number;
  /** 方块边长。 */
  size: number;
  /** 点阵覆盖区域(从角落算起)的宽高。 */
  spread: number;
  /** 角落处的最大出现概率。 */
  density: number;
};

export const HUD_MOSAIC_SPEC: MosaicSpec = {
  pitch: 6.5,
  size: 4,
  spread: 150,
  density: 0.62,
};

/** 固定哈希: 同样的格子永远得到同样的值, 不用 Math.random, 免得每帧抖动。 */
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * 生成一个角的点阵。
 * @param corner 落位的角; 点阵从该角向内侧铺开。
 */
export function buildCornerMosaic(
  width: number,
  height: number,
  corner: "topLeft" | "bottomRight",
  spec: MosaicSpec = HUD_MOSAIC_SPEC,
): MosaicCell[] {
  const cells: MosaicCell[] = [];
  if (width <= 0 || height <= 0) return cells;

  const spreadX = Math.min(spec.spread, width * 0.42);
  const spreadY = Math.min(spec.spread * 1.15, height * 0.42);
  const cols = Math.floor(spreadX / spec.pitch);
  const rows = Math.floor(spreadY / spec.pitch);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // 归一化的「离角距离」: 两轴取较大者, 让点阵沿对角线收敛。
      const d = Math.max(col / cols, row / rows);
      const chance = spec.density * (1 - d) ** 1.9;
      const r = hash(col, row + (corner === "topLeft" ? 0 : 977));
      if (r > chance) continue;

      const localX = col * spec.pitch;
      const localY = row * spec.pitch;
      // 尺寸有轻微变化: 少数格子并成 2 倍宽, 才有碎裂感而不是规整棋盘。
      const wide = hash(col + 31, row + 17) > 0.86;
      const size = spec.size * (wide ? 1.9 : 1);

      cells.push({
        x: corner === "topLeft" ? localX : width - localX - size,
        y: corner === "topLeft" ? localY : height - localY - size,
        size,
        opacity: Math.min(1, 0.28 + (1 - d) * 0.85),
      });
    }
  }

  return cells;
}
