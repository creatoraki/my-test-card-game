import selectedStockBorder from "@/assets/商店货架选中边框.png";
import idleStockBorder from "@/assets/商店货架未选中边框.png";
import idleStockReference from "@/assets/商店货架未选中原型.png";

// *_BORDER 是原型离线去柔光的产物(见 scripts/shelf-frame-cut.mjs): 只剩边框实体线,
// 两态都已对齐 198×291, 铺满货位即可。
export const SHOP_SELECTED_BORDER = selectedStockBorder;
export const SHOP_IDLE_BORDER = idleStockBorder;

// 未选中原型原件, 如今只剩价格牌的金币和斜角还在取(见 MarketPriceArtwork.tsx) ——
// 金币是暖色渐变实体, 不能走边框那套亮度阈值。
export const SHOP_IDLE_FRAME = idleStockReference;
