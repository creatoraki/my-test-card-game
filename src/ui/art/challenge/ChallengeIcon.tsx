// 挑战词条图标 —— 32×32 像素图标的统一入口, 外包一层 span 定尺寸,
// 避免被宿主的 `> svg` 描线样式(如悬浮卡徽章)误伤。
import type { ChallengeId } from "@/engine";
import { PixelGlyph } from "./PixelGlyph";
import { GLYPH_SIZE, getChallengeGlyph } from "./glyphs";
import s from "./ChallengeIcon.module.css";

interface ChallengeIconProps {
  id: ChallengeId;
  /** 渲染边长(CSS 像素), 取 32 的整数倍最清晰。 */
  size?: number;
  broken?: boolean;
  className?: string;
}

export function ChallengeIcon({ id, size = GLYPH_SIZE * 2, broken = false, className }: ChallengeIconProps) {
  return (
    <span className={`${s.icon} ${className ?? ""}`} style={{ width: size, height: size }} aria-hidden>
      <PixelGlyph grid={getChallengeGlyph(id)} gridSize={GLYPH_SIZE} size={size} broken={broken} />
    </span>
  );
}
