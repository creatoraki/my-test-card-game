import { readFileSync } from "node:fs";
import { decodePng } from "./lib/png.mjs";

const USAGE = `用法: node scripts/alpha-bbox.mjs <png...> [--alpha 8] [--frames N]

  --alpha N   alpha 低于 N 的像素视作透明(默认 8)。
  --frames N  横向拼条帧数; 只扫描首帧(默认 1)。`;

const args = process.argv.slice(2);
let alpha = 8;
let frames = 1;
const inputs = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--alpha") {
    alpha = Number(args[++i]);
  } else if (arg === "--frames") {
    frames = Number(args[++i]);
  } else {
    inputs.push(arg);
  }
}

if (!inputs.length || !Number.isInteger(alpha) || alpha < 0 || alpha > 255 || !Number.isInteger(frames) || frames < 1) {
  console.error(USAGE);
  process.exit(1);
}

function findAlphaBox(img, threshold, width) {
  if (img.colorType !== 4 && img.colorType !== 6) {
    throw new Error(`输入 PNG 不含 alpha 通道(colorType=${img.colorType})`);
  }
  const alphaOffset = img.colorType === 4 ? 1 : 3;
  let x0 = width, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < width; x++) {
      if (img.pixels[(y * img.w + x) * img.ch + alphaOffset] < threshold) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) throw new Error(`没有找到 alpha >= ${threshold} 的像素`);
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

for (const input of inputs) {
  try {
    const img = decodePng(readFileSync(input));
    if (img.w % frames !== 0) {
      throw new Error(`源图宽度 ${img.w} 不能被帧数 ${frames} 整除`);
    }
    const frameWidth = img.w / frames;
    const box = findAlphaBox(img, alpha, frameWidth);
    const bottomBlank = img.h - (box.y + box.h);
    console.log(`${input}`);
    console.log(`  源图 ${img.w}×${img.h} colorType=${img.colorType}  alpha阈值=${alpha}  帧数=${frames}`);
    console.log(`  包围盒 x=${box.x}, y=${box.y}, w=${box.w}, h=${box.h}`);
    console.log(`  展示框底部留白高 = ${bottomBlank} 源图 px; 主体宽高比 = ${(box.w / box.h).toFixed(3)}`);
    console.log(`  sheet: { w: ${img.w}, h: ${img.h} },`);
    console.log(`  body: { x: ${box.x}, y: ${box.y}, w: ${box.w}, h: ${box.h} },`);
  } catch (error) {
    console.error(`${input}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}