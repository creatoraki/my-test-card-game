import { SHOP_SELECTED_FRAME } from "@/ui/art/shopArt";
import s from "./MarketFrameArtwork.module.css";

// 四角保持原始 40×40 像素；边线单独取样，中心商品、文字、价格不参与渲染。
// 左右边只取 20px / 16px，避免把参考图里的商品插画带入边框。
const slices = [
  ["topLeft", "0 0 40 40"],
  ["top", "40 0 139 22"],
  ["topRight", "179 0 40 40"],
  ["left", "0 40 20 226"],
  ["right", "203 40 16 226"],
  ["bottomLeft", "0 266 40 40"],
  ["bottom", "40 284 139 22"],
  ["bottomRight", "179 266 40 40"],
] as const;

export function MarketFrameArtwork() {
  return (
    <span className={s.frame} aria-hidden="true">
      {slices.map(([position, viewBox]) => (
        <svg key={position} className={s[position]} viewBox={viewBox} preserveAspectRatio="none">
          <image href={SHOP_SELECTED_FRAME} width="219" height="306" />
        </svg>
      ))}
    </span>
  );
}
