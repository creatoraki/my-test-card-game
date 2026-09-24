import { createRandom } from "../../engine/seededRandom";
import { SCREEN_H, layerPxWidth } from "../core/grid";
import { packRamp, shadeRamp } from "../core/dither";
import { hash01 } from "../core/noise";
import { RIM_LIGHT, mixHex } from "../core/palette";
import { PixelBuffer, pack } from "../core/pixelBuffer";
import { postProcess } from "../core/spritePost";
import { vine } from "./flora";

// 前景：比世界层移动更快的近黑剪影——底部龟背竹大叶、顶部垂藤与偶尔掠过的立柱，
// 受光一侧带一圈暮色暖边，压住画面四周、拉开纵深。

const W = layerPxWidth("foreground");
const SIL = packRamp(["#04050a", "#07080f", "#0b0d17", "#10131f", "#171b2b", "#20243a"]);
const RIM = pack(mixHex(RIM_LIGHT, "#6a4a6a", 0.45));

/** 龟背竹式大叶：沿中脉的弧形叶面，边缘开裂、中脉与侧脉略亮。 */
function bigLeaf(buf: PixelBuffer, bx: number, by: number, len: number, angle: number, seed: number) {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const half = len * 0.36;
  const r = len + half;
  buf.paint(bx - r, by - r, bx + r, by + r, (x, y) => {
    const dx = x + 0.5 - bx;
    const dy = y + 0.5 - by;
    const u = dx * ca + dy * sa;
    const v = -dx * sa + dy * ca;
    if (u < 0 || u > len) return 0;
    const t = u / len;
    const w = Math.sin(t * Math.PI) ** 0.75 * half;
    const av = Math.abs(v);
    if (av > w) return 0;
    const band = (t * 7 + (v > 0 ? 0.5 : 0)) % 1;
    if (av > w * 0.45 && band < 0.14 + hash01(Math.floor(t * 7), v > 0 ? 1 : 0, seed) * 0.08) return 0;
    if (av < 0.8) return SIL[3];
    const vein = band > 0.5 && band < 0.58 && av < w * 0.9;
    return shadeRamp(SIL, (v < 0 ? 0.42 : 0.22) + (vein ? 0.18 : 0) - t * 0.1, x, y, 0.3);
  });
}

function pillar(buf: PixelBuffer, x: number) {
  buf.paint(x - 5, 0, x + 5, SCREEN_H - 1, (px, py) => {
    const across = (px + 0.5 - (x - 5)) / 10;
    const ring = py % 40 < 3;
    return shadeRamp(SIL, (ring ? 0.55 : 0.4) - across * 0.35, px, py, 0.3);
  });
}

export function bakeForeground(): HTMLCanvasElement {
  const buf = new PixelBuffer(W, SCREEN_H);
  const rand = createRandom(71);
  for (let x = rand.range(420, 600); x < W; x += rand.range(900, 1300)) pillar(buf, Math.round(x));
  for (let x = rand.range(20, 80); x < W; x += rand.range(70, 150)) {
    vine(buf, { x, y: -2, length: Math.round(rand.range(12, 46)), seed: rand.int(1, 1e6), leaf: SIL, spacing: 2 });
  }
  for (let x = rand.range(50, 120); x < W; x += rand.range(190, 300)) {
    const leaves = rand.int(3, 5);
    for (let i = 0; i < leaves; i++) {
      const angle = -Math.PI / 2 + rand.range(-0.9, 0.9);
      bigLeaf(buf, x + rand.range(-18, 18), SCREEN_H + 6, rand.range(26, 44), angle, rand.int(1, 1e6));
    }
  }
  postProcess(buf, { outline: 0, rim: 0.55, rimColor: RIM, shade: 0 });
  return buf.toCanvas();
}
