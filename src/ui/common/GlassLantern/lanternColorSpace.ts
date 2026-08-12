import { Color, LinearSRGBColorSpace } from "three";

/**
 * html-templates/能量灯.html 使用 three r128，hex 与 CSS 颜色直接作为线性值使用。
 * three r155+ 默认会将颜色转换为线性空间，这里显式跳过 sRGB 转换以复刻原版。
 * 不要改用全局 ColorManagement 开关，_legacy/ShelfTabRail3D 也依赖 three。
 */
export const legacyColor = (hex: number) => new Color().setHex(hex, LinearSRGBColorSpace);

export const setLegacyStyle = (target: Color, css: string) =>
  target.setStyle(css, LinearSRGBColorSpace);
