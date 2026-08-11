import { readFileSync } from "node:fs";
import { decodePng } from "./lib/png.mjs";

const USAGE = `用法: node scripts/alpha-bbox.mjs <png...> [--alpha 8]

  --alpha N  alpha 低于 N 的像素视作透明(默认 8)。`;

const args = process.argv.slice(2);
const alphaIndex = args.indexOf("--alpha");
const alpha = alphaIndex < 0 ? 8 : Number(args[alphaIndex + 1]);
const inputs = alphaIndex < 0
  ? args
  : args.filter((arg, index) => index !== alphaIndex && index !== alphaIndex + 1);

if (!inputs.length || !Number.isInteger(alpha) || alpha < 0 || alpha > 255) {
  console.error(USAGE);
  process.exit(1);
}

function findAlphaBox(img, threshold) {
  if (img.colorType !== 4 && img.colorType !== 6) {
    throw new Error(`输入 PNG 不含 alpha 通道(colorType=${img.colorType})`);
  }
  const alphaOffset = img.colorType === 4 ? 1 : 3;
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
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
    const box = findAlphaBox(img, alpha);
    const width = Math.round(220 * box.w / box.h);
    console.log(`${input}`);
    console.log(`  源图 ${img.w}×${img.h} colorType=${img.colorType}  alpha阈值=${alpha}`);
    console.log(`  包围盒 x=${box.x}, y=${box.y}, w=${box.w}, h=${box.h}`);
    console.log(`  内容框比例 ${box.w}/${box.h} = ${(box.w / box.h).toFixed(3)}`);
    console.log(`  基准高 220px 渲染尺寸 ${width}×220px`);
    console.log(`  box: { sw: ${img.w}, sh: ${img.h}, x: ${box.x}, y: ${box.y}, w: ${box.w}, h: ${box.h} },`);
  } catch (error) {
    console.error(`${input}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}