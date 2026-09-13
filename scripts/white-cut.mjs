// 白底横向循环场景抠图 —— 把白色底抠成透明 PNG, 供近景层叠在远景层之上。
// 与 chroma-cut.mjs 同属离线一次性工具: 产物提交进 assets, 运行时不参与。
// 零依赖: PNG 解码/编码全靠 Node 内置 zlib。
//
// 用法: node scripts/white-cut.mjs <in.png> <out.png> [选项]
//
// 不能照搬 chroma-cut: 白底的饱和度是 0, 色相判据整个失效; 而且无限循环场景不能裁包围盒,
// 一裁就对不上接缝与地面线, 故本脚本严格保持原始尺寸。
import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodeRgba } from "./lib/png.mjs";

function whiteCut(img, opts) {
  const { w, h, ch, pixels } = img;
  const { white, full, minArea, glowLuma, glowSat } = opts;
  const n = w * h;
  const at = (i) => i * ch;

  // 1) 近白候选
  const cand = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const o = at(i);
    if (pixels[o] >= white && pixels[o + 1] >= white && pixels[o + 2] >= white) cand[i] = 1;
  }

  // 2) 按连通块分背景与高光。不能用全图阈值: 霓虹灯管的芯部也是纯白, 一刀切会把灯管打穿;
  //    也不能只从画布边缘 flood fill: 建筑之间的空洞、铁丝网的网孔被结构隔断, 够不着边缘。
  //    判据是块的面积 + 块外圈一圈像素的亮度与彩度 —— 发光体外圈是高彩度霓虹, 铁丝网外圈
  //    是低彩度灰金属, 两者分得很开。
  const seen = new Uint8Array(n);
  const bg = new Uint8Array(n);
  const queue = new Int32Array(n);
  const stat = { big: 0, dim: 0, glow: 0 };
  for (let start = 0; start < n; start++) {
    if (!cand[start] || seen[start]) continue;
    let qh = 0, qt = 0;
    seen[start] = 1;
    queue[qt++] = start;
    let lumaSum = 0, satSum = 0, rim = 0;
    while (qh < qt) {
      const i = queue[qh++];
      const x = i % w, y = (i / w) | 0;
      const nb = [];
      if (x > 0) nb.push(i - 1);
      if (x < w - 1) nb.push(i + 1);
      if (y > 0) nb.push(i - w);
      if (y < h - 1) nb.push(i + w);
      for (const j of nb) {
        if (cand[j]) {
          if (!seen[j]) { seen[j] = 1; queue[qt++] = j; }
          continue;
        }
        const o = at(j);
        const r = pixels[o], g = pixels[o + 1], b = pixels[o + 2];
        lumaSum += 0.299 * r + 0.587 * g + 0.114 * b;
        satSum += Math.max(r, g, b) - Math.min(r, g, b);
        rim++;
      }
    }
    const luma = rim ? lumaSum / rim : 0;
    const sat = rim ? satSum / rim : 0;
    let isBg;
    if (qt >= minArea) { isBg = true; stat.big++; }
    else if (luma >= glowLuma && sat >= glowSat) { isBg = false; stat.glow++; }
    else { isBg = true; stat.dim++; }
    if (isBg) for (let k = 0; k < qt; k++) bg[queue[k]] = 1;
  }

  // 3) 生成 RGBA。背景块里介于 white..full 之间的是抗锯齿软边: 保留部分 alpha,
  //    并从白底反解前景色, 否则边缘会糊上一圈白。
  const rgba = Buffer.alloc(n * 4);
  let cleared = 0, soft = 0;
  for (let i = 0; i < n; i++) {
    const o = at(i), q = i * 4;
    const r = pixels[o], g = pixels[o + 1], b = pixels[o + 2];
    if (!bg[i]) {
      rgba[q] = r; rgba[q + 1] = g; rgba[q + 2] = b;
      rgba[q + 3] = ch === 4 ? pixels[o + 3] : 255;
      continue;
    }
    const level = Math.min(r, g, b);
    const a = level >= full ? 0 : Math.round(((full - level) / (full - white)) * 255);
    if (a === 0) { cleared++; continue; } // alpha 已是 0
    const f = a / 255;
    for (let k = 0; k < 3; k++) {
      rgba[q + k] = Math.max(0, Math.min(255, Math.round((pixels[o + k] - 255 * (1 - f)) / f)));
    }
    rgba[q + 3] = a;
    soft++;
  }

  return { rgba, cleared, soft, stat };
}

const USAGE = `用法: node scripts/white-cut.mjs <in.png> <out.png> [选项]

  --white N       近白候选阈值(三通道下限, 默认 234)。
  --full N        视作纯背景的白度(默认 250)。white..full 之间按软边羽化。
  --min-area N    超过此面积的白块直接判背景(默认 1200)。
  --glow-luma N   小白块外圈平均亮度高于此值才可能是发光体(默认 168)。
  --glow-sat N    小白块外圈平均彩度高于此值才判发光体(默认 38) —— 灰色铁丝网靠这道闸排除。`;

const args = process.argv.slice(2);
const skip = new Set();
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  if (i < 0) return dflt;
  skip.add(i).add(i + 1);
  return Number(args[i + 1]);
};
const white = flag("--white", 234);
const full = flag("--full", 250);
const minArea = flag("--min-area", 1200);
const glowLuma = flag("--glow-luma", 168);
const glowSat = flag("--glow-sat", 38);
const [input, output] = args.filter((_, i) => !skip.has(i));

if (!input || !output || ![white, full, minArea, glowLuma, glowSat].every(Number.isFinite)) {
  console.error(USAGE);
  process.exit(1);
}

const img = decodePng(readFileSync(input));
const { rgba, cleared, soft, stat } = whiteCut(img, { white, full, minArea, glowLuma, glowSat });
writeFileSync(output, encodeRgba(rgba, img.w, img.h));

console.log(`源图    ${img.w}×${img.h} colorType=${img.colorType}`);
console.log(`参数    white=${white} full=${full} min-area=${minArea} glow-luma=${glowLuma} glow-sat=${glowSat}`);
console.log(`白块    大块背景 ${stat.big} / 暗圈背景 ${stat.dim} / 保留发光 ${stat.glow}`);
console.log(`产物    ${output}  ${img.w}×${img.h}  透明 ${cleared}px + 软边 ${soft}px (${((cleared / (img.w * img.h)) * 100).toFixed(1)}%)`);
