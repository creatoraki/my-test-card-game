// 四宫格状态图标切图脚本。
// 输入图必须保持 2×2 布局：左上中毒、右上烧伤、左下护盾、右下增幅（锋利）。
// 坐标以 1254×1254 原图为基准；裁切时会按输入图尺寸等比缩放。

import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const BASE_SIZE = 1254;
const OUTPUT_SIZE = 64;
const CIRCLE_FEATHER = 5;
const OUTPUT_DIRECTORY = resolve("src/assets/buffs");
const CROPS = [
  { label: "中毒", filename: "中毒.png", left: 129, top: 57 },
  { label: "烧伤", filename: "烧伤.png", left: 677, top: 57 },
  { label: "护盾", filename: "护盾.png", left: 129, top: 614 },
  { label: "增幅（锋利）", filename: "锋利.png", left: 677, top: 614 },
];
const BASE_CROP_SIZE = 440;

function applyCircularAlpha(rgba, width, height) {
  const centerX = (width - 1) / 2;
  const centerY = (height - 1) / 2;
  const radius = Math.min(width, height) / 2 - 0.5;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const distance = Math.hypot(x - centerX, y - centerY);
      const edgeAlpha = Math.max(0, Math.min(1, (radius - distance) / CIRCLE_FEATHER));
      rgba[offset + 3] = Math.round(rgba[offset + 3] * edgeAlpha);
    }
  }

  return rgba;
}

async function main() {
  const inputArgument = process.argv[2];
  if (!inputArgument) {
    console.error("用法：node scripts/crop-status-buffs.mjs <四宫格原图路径>");
    process.exitCode = 1;
    return;
  }

  const inputPath = resolve(inputArgument);
  const metadata = await sharp(inputPath).metadata();
  if (!metadata.width || !metadata.height || metadata.width !== metadata.height) {
    throw new Error("输入原图必须是正方形四宫格图片。");
  }

  const scale = metadata.width / BASE_SIZE;
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });

  for (const crop of CROPS) {
    const left = Math.round(crop.left * scale);
    const top = Math.round(crop.top * scale);
    const size = Math.round(BASE_CROP_SIZE * scale);
    const { data, info } = await sharp(inputPath)
      .extract({ left, top, width: size, height: size })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    applyCircularAlpha(data, info.width, info.height);
    const outputPath = resolve(OUTPUT_DIRECTORY, crop.filename);
    await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, { kernel: "lanczos3" })
      .png()
      .toFile(outputPath);

    console.log(`已裁切：${crop.label} → ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(`切图失败：${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
