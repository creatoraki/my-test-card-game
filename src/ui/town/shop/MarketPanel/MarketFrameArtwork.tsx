import { SHOP_IDLE_FRAME, SHOP_SELECTED_FRAME } from "@/ui/art/shopArt";
import s from "./MarketFrameArtwork.module.css";

// 统一到未选中原型的 198×291 坐标；选中图裁掉多余外沿，使两态边框对齐。
// 分片只覆盖空白边缘，避开原图商品、名称、分类和价格。
const slices = [
  [0, 0, 32, 32], [32, 0, 134, 18], [166, 0, 32, 32],
  [0, 32, 18, 227], [190, 32, 8, 227],
  [0, 259, 32, 32], [32, 282, 134, 9], [166, 259, 32, 32],
] as const;

export function MarketFrameArtwork({ selected = false }: { selected?: boolean }) {
  return (
    <svg className={s.frame} viewBox="0 0 198 291" fill="none" aria-hidden="true">
      {slices.map(([x, y, width, height]) => (
        <svg key={`${x}-${y}`} x={x} y={y} width={width} height={height}
          viewBox={`${x} ${y} ${width} ${height}`} overflow="hidden">
          {selected ? (
            <svg width="198" height="291" viewBox="7 4 208 298" preserveAspectRatio="none">
              <image href={SHOP_SELECTED_FRAME} width="219" height="306" />
            </svg>
          ) : <image href={SHOP_IDLE_FRAME} width="198" height="291" />}
        </svg>
      ))}
    </svg>
  );
}
