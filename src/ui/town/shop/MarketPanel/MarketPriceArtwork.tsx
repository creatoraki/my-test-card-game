import { SHOP_IDLE_FRAME } from "@/ui/art/shopArt";
import s from "./MarketPriceArtwork.module.css";

// 原图价格牌为 x=54、y=246 的 92×31 区域；四片保留金币和斜角，排除原售价数字。
const slices = [
  ["left", "54 246 44 31"], ["top", "98 246 40 5"],
  ["bottom", "98 273 40 4"], ["right", "138 246 8 31"],
] as const;

export function MarketPriceArtwork() {
  return (
    <span className={s.artwork} aria-hidden="true">
      {slices.map(([position, viewBox]) => (
        <svg key={position} className={s[position]} viewBox={viewBox}
          preserveAspectRatio="none" overflow="hidden">
          <image href={SHOP_IDLE_FRAME} width="198" height="291" />
        </svg>
      ))}
    </span>
  );
}
