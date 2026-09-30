// ============================================================================
// 像素画布 —— 以像素中心采样的几何图元 + 描边/明暗后处理, 产出 size×size 色值网格。
// 所有坐标都是像素坐标(左上为 0,0), 图元按"像素中心是否落在形状内"决定填色。
// ============================================================================

export type Px = string | null;
export type Point = readonly [number, number];

export class PixelCanvas {
  readonly size: number;
  readonly px: Px[];

  constructor(size = 32) {
    this.size = size;
    this.px = new Array<Px>(size * size).fill(null);
  }

  inside(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }

  get(x: number, y: number): Px {
    return this.inside(x, y) ? this.px[y * this.size + x] : null;
  }

  set(x: number, y: number, color: Px) {
    if (this.inside(x, y)) this.px[y * this.size + x] = color;
  }

  /** 逐像素测试中心点, 通用填色入口。 */
  paint(test: (cx: number, cy: number) => boolean, color: Px) {
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (test(x + 0.5, y + 0.5)) this.set(x, y, color);
      }
    }
    return this;
  }

  rect(x: number, y: number, w: number, h: number, color: Px) {
    for (let j = y; j < y + h; j += 1) for (let i = x; i < x + w; i += 1) this.set(i, j, color);
    return this;
  }

  dots(points: Point[], color: Px) {
    points.forEach(([x, y]) => this.set(x, y, color));
    return this;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: Px) {
    return this.paint((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, color);
  }

  disc(cx: number, cy: number, r: number, color: Px) {
    return this.ellipse(cx, cy, r, r, color);
  }

  /** 圆环; from/to 为角度区间(度, 0 = 正右, 顺时针), 缺省为整环。 */
  ring(cx: number, cy: number, inner: number, outer: number, color: Px, from = 0, to = 360) {
    return this.paint((x, y) => {
      const r = Math.hypot(x - cx, y - cy);
      if (r < inner || r > outer) return false;
      const a = (Math.atan2(y - cy, x - cx) * 180 / Math.PI + 360) % 360;
      return from <= to ? a >= from && a <= to : a >= from || a <= to;
    }, color);
  }

  poly(points: Point[], color: Px) {
    return this.paint((x, y) => {
      let hit = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    }, color);
  }

  /** 方笔刷直线(Bresenham), width 为笔刷边长。 */
  line(x0: number, y0: number, x1: number, y1: number, color: Px, width = 1) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    const off = Math.floor((width - 1) / 2);
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.rect(x - off, y - off, width, width, color);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
    return this;
  }

  /** 把满足条件的 from 色像素换成 to 色(用于分面、渐变带)。 */
  recolor(from: Px, to: Px, where: (x: number, y: number) => boolean = () => true) {
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (this.get(x, y) === from && where(x, y)) this.set(x, y, to);
      }
    }
    return this;
  }

  /** 经典像素明暗: 左上边缘提亮, 右下边缘压暗(depth 为暗边厚度)。 */
  shade(base: string, light: string | null, dark: string | null, depth = 1) {
    const src = this.px.slice();
    const at = (x: number, y: number) => (this.inside(x, y) ? src[y * this.size + x] : null);
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (at(x, y) !== base) continue;
        let edgeDark = false;
        for (let k = 1; k <= depth; k += 1) {
          if (at(x + k, y) !== base || at(x, y + k) !== base) edgeDark = true;
        }
        if (dark && edgeDark) this.set(x, y, dark);
        else if (light && (at(x - 1, y) !== base || at(x, y - 1) !== base)) this.set(x, y, light);
      }
    }
    return this;
  }

  /** 在所有非空像素外围描一圈; diagonal 为 true 时连对角也描, 轮廓更圆润饱满。 */
  outline(color: string, diagonal = false) {
    const src = this.px.slice();
    const filled = (x: number, y: number) => this.inside(x, y) && src[y * this.size + x] !== null;
    const around: Point[] = diagonal
      ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
      : [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (filled(x, y)) continue;
        if (around.some(([dx, dy]) => filled(x + dx, y + dy))) this.set(x, y, color);
      }
    }
    return this;
  }

  /** 把另一张画布作为贴纸盖上来, 贴纸外围先压一圈描边, 让前后部件分离。 */
  stamp(layer: PixelCanvas, outlineColor: string | null = null) {
    if (outlineColor) {
      const ring = new PixelCanvas(this.size);
      layer.px.forEach((c, i) => { ring.px[i] = c; });
      ring.outline(outlineColor);
      ring.px.forEach((c, i) => { if (c === outlineColor && layer.px[i] === null) this.px[i] = c; });
    }
    layer.px.forEach((c, i) => { if (c !== null) this.px[i] = c; });
    return this;
  }
}
