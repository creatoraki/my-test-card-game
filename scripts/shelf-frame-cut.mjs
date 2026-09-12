// 商店货位边框去柔光 —— 把两张货架原型里的边框剥成透明 PNG, 只留实体线。
//
// 原型素材(商店货架选中/未选中原型.png)是不透明整图, 边框的金色 bloom 和角落暗底都烘死在
// 像素里。运行时按切片贴到货位上, 等于把"暗底+扩散光"整块糊在卡面插画上 —— 就是四角那四团
// 金斑的来源。这里离线把它剥掉: 边框实体线亮度高(选中态 L≈255, 未选中态 L≈77~89), 柔光和
// 暗底亮度低(L≤36~116), 按亮度映射 alpha 就能分家, RGB 原样不动。
//
// 用法: node scripts/shelf-frame-cut.mjs [--sel-lo 90] [--sel-hi 170] [--idle-lo 32] [--idle-hi 72]
//
// 产物只作边框用; 价格牌的金币和斜角仍从未选中原型取(见 MarketPriceArtwork.tsx), 故原型
// 素材必须原样保留 —— 金币是暖色渐变实体, 一旦过阈值就碎了。
import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodeRgba } from "./lib/png.mjs";

// 产物统一到未选中原型的 198×291 坐标, 运行时一张 image 铺满即可, 不再需要对齐魔法数。
const W = 198;
const H = 291;

// 保留区: 非边框区域先整块裁掉。不裁的话, 中央的商品插画、名称、分类标签、售价数字都会
// 因为亮度高而被阈值留下来。坐标沿用 MarketFrameArtwork 里已验证过的两套切片。
const SELECTED_KEEP = [
  [0, 0, 32, 32], [32, 0, 134, 18], [166, 0, 32, 32],
  [0, 32, 18, 227], [190, 32, 8, 227],
  [0, 259, 32, 32], [32, 282, 134, 9], [166, 259, 32, 32],
];
// 未选中态右侧收窄 6px: 原图最右那条暖金投影里有 L≈66 的亮区, 正落在阈值保留带内,
// 只能靠裁切排除 —— 这也是原 idleSlices 右侧比选中态窄的原因。
const IDLE_KEEP = [
  [0, 0, 32, 32], [32, 0, 134, 18], [166, 0, 26, 32],
  [0, 32, 18, 227], [190, 32, 2, 227],
  [0, 259, 32, 32], [32, 282, 134, 9], [166, 259, 26, 32],
];

// ---- 像素处理 ----

// 选中原型是 219×306, 比未选中多一圈外沿; (7,4,208,298) 这一窗对齐两态边框,
// 与被替换掉的运行时 viewBox="7 4 208 298" 同一组数。
const SELECTED_WINDOW = { left: 7, top: 4, width: 208, height: 298 };

function readRgb(file) {
  const img = decodePng(readFileSync(file));
  if (img.ch < 3) throw new Error(`${file}: 需要 RGB/RGBA, 实际通道数 ${img.ch}`);
  return img;
}

// 双线性重采样: 把源图的 window 区域拉到 W×H。1px 细线经不起最近邻, 会断。
function resample(img, window) {
  const { left, top, width, height } = window;
  const out = Buffer.alloc(W * H * 4);
  const at = (x, y, k) => {
    const cx = Math.min(img.w - 1, Math.max(0, x));
    const cy = Math.min(img.h - 1, Math.max(0, y));
    return img.pixels[(cy * img.w + cx) * img.ch + k];
  };
  for (let y = 0; y < H; y++) {
    const sy = top + ((y + 0.5) * height) / H - 0.5;
    const y0 = Math.floor(sy);
    const fy = sy - y0;
    for (let x = 0; x < W; x++) {
      const sx = left + ((x + 0.5) * width) / W - 0.5;
      const x0 = Math.floor(sx);
      const fx = sx - x0;
      const o = (y * W + x) * 4;
      for (let k = 0; k < 3; k++) {
        const top_ = at(x0, y0, k) * (1 - fx) + at(x0 + 1, y0, k) * fx;
        const bot = at(x0, y0 + 1, k) * (1 - fx) + at(x0 + 1, y0 + 1, k) * fx;
        out[o + k] = Math.round(top_ * (1 - fy) + bot * fy);
      }
      out[o + 3] = 255;
    }
  }
  return out;
}

function copyAsRgba(img) {
  if (img.w !== W || img.h !== H) throw new Error(`未选中原型应为 ${W}×${H}, 实际 ${img.w}×${img.h}`);
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    for (let k = 0; k < 3; k++) out[i * 4 + k] = img.pixels[i * img.ch + k];
    out[i * 4 + 3] = 255;
  }
  return out;
}

const inKeep = (keep, x, y) =>
  keep.some(([kx, ky, kw, kh]) => x >= kx && x < kx + kw && y >= ky && y < ky + kh);

// 亮度 → alpha。smoothstep 给线条留软边, 硬阈值会啃出锯齿。
function cutGlow(rgba, keep, lo, hi) {
  let kept = 0;
  let solid = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      if (!inKeep(keep, x, y)) {
        rgba[o + 3] = 0;
        continue;
      }
      const lum = 0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2];
      const t = Math.min(1, Math.max(0, (lum - lo) / (hi - lo)));
      const alpha = Math.round(t * t * (3 - 2 * t) * 255);
      rgba[o + 3] = alpha;
      if (alpha > 0) kept++;
      if (alpha === 255) solid++;
    }
  }
  return { kept, solid };
}

// ---- CLI ----

const USAGE = `用法: node scripts/shelf-frame-cut.mjs [选项]

  --sel-lo N   选中态亮度下限(默认 90)。调低 → 金线更饱满, 过低会把柔光带回来。
  --sel-hi N   选中态亮度上限(默认 170)。
  --idle-lo N  未选中态亮度下限(默认 32)。
  --idle-hi N  未选中态亮度上限(默认 72)。`;

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  return i < 0 ? dflt : Number(args[i + 1]);
};
const selLo = flag("--sel-lo", 90);
const selHi = flag("--sel-hi", 170);
const idleLo = flag("--idle-lo", 32);
const idleHi = flag("--idle-hi", 72);

if (![selLo, selHi, idleLo, idleHi].every(Number.isFinite) || selLo >= selHi || idleLo >= idleHi) {
  console.error(USAGE);
  process.exit(1);
}

const jobs = [
  {
    label: "选中态",
    input: "src/assets/商店货架选中原型.png",
    output: "src/assets/商店货架选中边框.png",
    window: SELECTED_WINDOW,
    keep: SELECTED_KEEP,
    lo: selLo,
    hi: selHi,
  },
  {
    label: "未选中态",
    input: "src/assets/商店货架未选中原型.png",
    output: "src/assets/商店货架未选中边框.png",
    window: null,
    keep: IDLE_KEEP,
    lo: idleLo,
    hi: idleHi,
  },
];

for (const job of jobs) {
  const img = readRgb(job.input);
  const rgba = job.window ? resample(img, job.window) : copyAsRgba(img);
  const { kept, solid } = cutGlow(rgba, job.keep, job.lo, job.hi);
  writeFileSync(job.output, encodeRgba(rgba, W, H));
  console.log(`${job.label}  源图 ${img.w}×${img.h} colorType=${img.colorType}`);
  console.log(`  阈值 lo=${job.lo} hi=${job.hi}${job.window ? `  归一窗 ${job.window.left},${job.window.top},${job.window.width},${job.window.height}` : "  无需归一"}`);
  console.log(`  留存 ${kept} px(其中全不透明 ${solid} px), 占画布 ${((kept / (W * H)) * 100).toFixed(1)}%`);
  console.log(`  产物 ${job.output}  ${W}×${H}`);
}
