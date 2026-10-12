import type { DeathGeometry } from "@/ui/battle/fx/EnemyDeathFx/deathGeometry";

/**
 * 命中特效可选的立绘贴图(魂魄抽离等需要采样目标轮廓的特效用)。
 * fig = 立绘展示框 [左, 下, 宽, 高]：相对受击锚点(.vfx 的 0×0 定位点)、y 朝上、
 * 单位为 .vfx 内的设计 px(已除掉 --place-scale，与着色器坐标一致)。
 */
export interface HitPortrait {
  texture: TexImageSource;
  fig: readonly [number, number, number, number];
}

/**
 * 由余烬焚解的几何换算受击锚点处的立绘框。锚点规则与 HitFxLayer.module.css 的 .vfx 一致:
 * 横向 = 主体中心, 纵向 = 主体底边上方 0.48 倍主体高。deathGeometry 已含体型倍率, 而 .vfx 自带
 * scale: var(--place-scale), 故整体除以 scale 折回特效内坐标。
 */
export function hitPortraitFig(geo: DeathGeometry, scale: number): HitPortrait["fig"] {
  const [fx, fy, fw, fh] = geo.fig;
  const [bx, by, bw, bh] = geo.body;
  const ax = bx + bw / 2;
  const ay = by + bh * 0.48;
  const k = scale > 0 ? 1 / scale : 1;
  return [(fx - ax) * k, (fy - ay) * k, fw * k, fh * k];
}
