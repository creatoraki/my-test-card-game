import { SHOP_IDLE_BORDER, SHOP_SELECTED_BORDER } from "@/ui/art/shopArt";
import s from "./MarketFrameArtwork.module.css";

// 边框素材已离线去柔光并统一到 198×291(见 scripts/shelf-frame-cut.mjs), 非边框区域是透明的,
// 所以这里直接铺满一张图 —— 不必再按分片避开原图的商品、名称、分类和价格。
export function MarketFrameArtwork({ selected = false }: { selected?: boolean }) {
  return (
    <svg className={s.frame} viewBox="0 0 198 291" fill="none" aria-hidden="true">
      <image
        href={selected ? SHOP_SELECTED_BORDER : SHOP_IDLE_BORDER}
        width="198"
        height="291"
      />
    </svg>
  );
}
