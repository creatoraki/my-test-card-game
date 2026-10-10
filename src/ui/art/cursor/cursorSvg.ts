/** 单个指针图形：32×32 画布内的 SVG 内容与热点坐标。 */
export interface CursorGlyph {
  /** 不含外层 <svg> 的内部标记，坐标系固定为 viewBox 0 0 32 32。 */
  body: string;
  /** 点击生效点，单位同 viewBox。 */
  hotspot: readonly [number, number];
}

/** 指针绘制画布边长。 */
export const CURSOR_VIEWBOX = 32;

/** 拼出完整 SVG 文档，size 为输出像素边长。 */
export function cursorSvgMarkup(glyph: CursorGlyph, size: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${CURSOR_VIEWBOX} ${CURSOR_VIEWBOX}">${glyph.body}</svg>`;
}

export function cursorDataUri(glyph: CursorGlyph, size: number) {
  return `data:image/svg+xml,${encodeURIComponent(cursorSvgMarkup(glyph, size))}`;
}

/** 生成可直接写入 CSS cursor 的值，热点按输出尺寸等比换算；fallback 为图片失效时的系统关键字。 */
export function cursorCssValue(glyph: CursorGlyph, size: number, fallback: string) {
  const ratio = size / CURSOR_VIEWBOX;
  const [hx, hy] = glyph.hotspot.map((v) => Math.round(v * ratio));
  return `url("${cursorDataUri(glyph, size)}") ${hx} ${hy}, ${fallback}`;
}

/** 齿轮轮廓：每个齿为内外圈之间的梯形；phase 为整体转角(弧度)。 */
export function gearPath(cx: number, cy: number, outer: number, inner: number, teeth: number, phase = 0) {
  const step = (Math.PI * 2) / teeth;
  const point = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  const parts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = phase + i * step;
    parts.push(point(inner, a), point(outer, a + step * 0.15), point(outer, a + step * 0.45), point(inner, a + step * 0.6));
  }
  return `M${parts.join(" L")} Z`;
}
