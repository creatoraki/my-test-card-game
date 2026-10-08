// 挑战 id → 32×32 像素图标。绘制是纯函数, 首次取用时烘焙一次后缓存。
import type { ChallengeId } from "@/engine";
import type { PixelCanvas, Px } from "../pixel/PixelCanvas";
import { drawMercy, drawNoRedraw, drawSlowStart } from "./basicGlyphs";
import { drawContent, drawHonorable, drawNoWait, drawPlain } from "./basicExtraGlyphs";
import { drawFocusFire, drawLowCost, drawRestraint } from "./midGlyphs";
import { drawAscending, drawNoDiscard, drawNoHeal, drawRegicide, drawSteady, drawSwiftWin } from "./midExtraGlyphs";
import { drawLoneBlade, drawMassacre, drawRotation, drawUntouched } from "./hardGlyphs";

export const GLYPH_SIZE = 32;

const DRAWERS: Record<ChallengeId, () => PixelCanvas> = {
  mercy: drawMercy,
  no_redraw: drawNoRedraw,
  slow_start: drawSlowStart,
  no_wait: drawNoWait,
  content: drawContent,
  plain: drawPlain,
  honorable: drawHonorable,
  restraint: drawRestraint,
  no_discard: drawNoDiscard,
  steady: drawSteady,
  ascending: drawAscending,
  no_heal: drawNoHeal,
  swift_win: drawSwiftWin,
  regicide: drawRegicide,
  focus_fire: drawFocusFire,
  low_cost: drawLowCost,
  untouched: drawUntouched,
  lone_blade: drawLoneBlade,
  massacre: drawMassacre,
  rotation: drawRotation,
};

const cache = new Map<ChallengeId, readonly Px[]>();

export function getChallengeGlyph(id: ChallengeId): readonly Px[] {
  let grid = cache.get(id);
  if (!grid) {
    grid = DRAWERS[id]().px;
    cache.set(id, grid);
  }
  return grid;
}
