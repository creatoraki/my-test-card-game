import type { EnemyPlacement } from "@/data";
import type { EnemySpriteDef } from "@/ui/art/battle/enemyArt";

// 与 styles/tokens.css 的 --foe-figure-h 保持一致(立绘主体统一高度)。着色器画布需要设计 px 的
// 数值尺寸, 读不到 CSS 变量, 只能在这里同步一份。
export const FOE_FIGURE_H = 256;

/** 余烬焚解画布的几何: 全部为设计 px, 矩形原点在画布左下角(与着色器坐标同向)。 */
export interface DeathGeometry {
  width: number;
  height: number;
  /** 画布底边伸出立绘底边的距离, 给脚下冲击环留地方。 */
  padBottom: number;
  /** 立绘展示框(= 贴图全幅) [x, y, w, h]。 */
  fig: readonly [number, number, number, number];
  /** 立绘主体(alpha 包围盒) [x, y, w, h], 燃烧前沿与灰烬都按它走。 */
  body: readonly [number, number, number, number];
}

function frame(figW: number, figH: number, body: { x: number; y: number; w: number; h: number }): DeathGeometry {
  const padX = Math.round(figW * 0.22 + 48);
  // 上方留给向上飘散的灰烬, 下方留给脚下冲击环。
  const padTop = Math.round(figH * 0.4 + 56);
  const padBottom = 56;
  return {
    width: Math.round(figW + padX * 2),
    height: Math.round(figH + padTop + padBottom),
    padBottom,
    fig: [padX, padBottom, figW, figH],
    body: [padX + body.x, padBottom + body.y, body.w, body.h],
  };
}

/**
 * 按 CombatantView 下发 --sprite-k/--fig-* 的同一套算式换算立绘几何:
 * k = 主体统一高度 × 体型倍率 / 主体源图高; 展示框 = view × k; 主体按 view 底边折算到左下原点。
 * 左右镜像时主体框一并镜像(贴图本身在 deathTexture 里已翻转)。
 */
export function deathGeometry(sprite: EnemySpriteDef | undefined, placement: EnemyPlacement | undefined): DeathGeometry {
  if (!sprite) {
    // emoji 兜底: 与 CombatantView 的缺省几何一致, 主体即整幅。
    return frame(FOE_FIGURE_H, FOE_FIGURE_H, { x: 0, y: 0, w: FOE_FIGURE_H, h: FOE_FIGURE_H });
  }
  const view = sprite.view ?? { x: 0, y: 0, w: sprite.sheet.w / sprite.frames, h: sprite.sheet.h };
  const body = sprite.body;
  const k = (FOE_FIGURE_H * (placement?.scale ?? 1)) / body.h;
  const figW = view.w * k;
  const figH = view.h * k;
  const left = (body.x - view.x) * k;
  const bodyW = body.w * k;
  return frame(figW, figH, {
    x: placement?.flip ? figW - left - bodyW : left,
    y: (view.y + view.h - (body.y + body.h)) * k,
    w: bodyW,
    h: body.h * k,
  });
}
