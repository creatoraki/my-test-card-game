import { mixPacked, pack, type PixelBuffer } from "../../core/pixelBuffer";
import { HERO_RAMPS } from "./heroParts";
import type { Pt } from "./heroRig";

// 身后长发：verlet 链条在世界像素坐标中模拟，跑动时向后拖曳、跳起时被气流托起、落地时甩动。

const COUNT = 9;
const SEG = 2;
const STEP = 1 / 120;
const GRAVITY = 520;
const DRAG = 0.975;

interface Node {
  x: number;
  y: number;
  px: number;
  py: number;
}

export class HairChain {
  private nodes: Node[] = [];
  private acc = 0;

  reset(root: Pt, facing: number) {
    this.nodes = Array.from({ length: COUNT }, (_, i) => {
      const x = root.x - facing * i * 0.8;
      const y = root.y + i * SEG * 0.9;
      return { x, y, px: x, py: y };
    });
  }

  /** root 为世界像素坐标下的发根；facing 决定发丝飘向身后的偏置方向。 */
  step(root: Pt, facing: number, dt: number, time: number) {
    if (this.nodes.length === 0 || Math.hypot(this.nodes[0].x - root.x, this.nodes[0].y - root.y) > 30) this.reset(root, facing);
    this.acc = Math.min(this.acc + dt, 0.1);
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.integrate(root, facing, time);
    }
  }

  private integrate(root: Pt, facing: number, time: number) {
    const nodes = this.nodes;
    nodes[0].px = nodes[0].x;
    nodes[0].py = nodes[0].y;
    nodes[0].x = root.x;
    nodes[0].y = root.y;
    for (let i = 1; i < COUNT; i++) {
      const n = nodes[i];
      const vx = (n.x - n.px) * DRAG;
      const vy = (n.y - n.py) * DRAG;
      n.px = n.x;
      n.py = n.y;
      const breeze = Math.sin(time * 2.1 + i * 0.7) * 50;
      n.x += vx + (-facing * 90 + breeze) * STEP * STEP;
      n.y += vy + GRAVITY * STEP * STEP;
    }
    for (let k = 0; k < 4; k++) {
      for (let i = 1; i < COUNT; i++) {
        const a = nodes[i - 1];
        const b = nodes[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const diff = (d - SEG) / d;
        if (i === 1) {
          b.x -= dx * diff;
          b.y -= dy * diff;
        } else {
          a.x += dx * diff * 0.5;
          a.y += dy * diff * 0.5;
          b.x -= dx * diff * 0.5;
          b.y -= dy * diff * 0.5;
        }
      }
    }
  }

  /** 以朝右的局部坐标绘制：toLocal 把世界坐标换算到角色缓冲。 */
  draw(buf: PixelBuffer, toLocal: (p: Pt) => Pt) {
    const pts = this.nodes.map((n) => toLocal(n));
    const base = pack(HERO_RAMPS.hair[2]);
    const shade = pack(HERO_RAMPS.hair[1]);
    const light = pack(HERO_RAMPS.hair[3]);
    for (let i = 0; i < pts.length - 1; i++) {
      const t = i / (pts.length - 1);
      const r = 3.4 - t * 2.4;
      const a = pts[i];
      const b = pts[i + 1];
      buf.capsule(a.x, a.y, b.x, b.y, r, mixPacked(base, shade, t * 0.5));
    }
    for (let i = 0; i < pts.length - 2; i++) {
      const t = i / (pts.length - 1);
      const r = 3.4 - t * 2.4;
      const a = pts[i];
      const b = pts[i + 1];
      buf.capsule(a.x - r * 0.35, a.y - r * 0.3, b.x - r * 0.35, b.y - r * 0.3, Math.max(0.5, r * 0.3), light);
    }
  }
}
