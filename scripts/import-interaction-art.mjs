// 将透明四宫格按文档顺序切图，保留原图并导出游戏用 WebP。
// 用法：node scripts/import-interaction-art.mjs 四宫格PNG路径 批次编号 [左下修正版四宫格]
import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { alignProp, separateFourProps } from "./lib/transparent-prop-layout.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const batches = [
  ["补给货箱堆", "机械残骸", "封印遗物匣", "祝福礼匣"],
  ["萤露医疗站", "熔合锻炉", "星辉神龛", "羁绊织机"],
  ["鉴定镜台", "锻造师工位", "悬浮货车", "信使投递站"],
  ["坍塌顶板", "泄漏管道", "失控无人机", "根网档案台"],
  ["孢子风阀", "补给货箱堆·乙", "机械残骸·乙", "萤露医疗站·乙"],
];
const positions = ["左上", "右上", "左下", "右下"];

function alphaBounds(data, width, height, threshold) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < threshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < 0) throw new Error("素材没有可见主体。");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function requireNewFile(file) {
  try { await access(file); } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`文件已存在，为避免覆盖已停止：${file}`);
}

async function main() {
  const [source, batchArgument, replacementSource] = process.argv.slice(2);
  const batch = Number(batchArgument);
  if (!source || !Number.isInteger(batch) || !batches[batch - 1]) {
    throw new Error("用法：node scripts/import-interaction-art.mjs 四宫格PNG路径 批次编号（1～5） [左下修正版四宫格]");
  }
  const input = path.resolve(source);
  const metadata = await sharp(input).metadata();
  if (metadata.format !== "png" || !metadata.hasAlpha
    || metadata.width !== metadata.height || metadata.width % 2 !== 0) {
    throw new Error("原图必须是带透明通道、边长为偶数的正方形 PNG。");
  }
  const archive = path.join(root, `生图模型输出目录/交互物/第${batch}批`);
  const destination = path.join(root, "src/assets/explore-corridor/交互物");
  const original = path.join(archive, "四宫格原图.png");
  const normalizedSheet = path.join(archive, "四宫格标准画布.png");
  const replacementArchive = replacementSource ? path.join(archive, "左下修正版原图.png") : null;
  const manifest = path.join(archive, "素材清单.json");
  const names = batches[batch - 1];
  const pngFiles = names.map((name) => path.join(archive, `${name}.png`));
  const webpFiles = names.map((name) => path.join(destination, `${name}.webp`));
  for (const file of [original, normalizedSheet, manifest, replacementArchive, ...pngFiles, ...webpFiles].filter(Boolean)) {
    await requireNewFile(file);
  }

  // 按完整透明主体分离，避免机械按中线切割截断封印光晕等边缘。
  const sheet = await separateFourProps(input);
  if (replacementSource) {
    const replacement = await separateFourProps(path.resolve(replacementSource));
    sheet.props[2] = replacement.props[2];
  }
  const size = 1024;
  const outputs = [];
  for (let index = 0; index < names.length; index += 1) {
    const prop = sheet.props[index];
    const { image: png } = await alignProp(prop, size, 77);
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparentPixels = 0;
    for (let offset = 3; offset < data.length; offset += 4) {
      if (data[offset] === 0) transparentPixels += 1;
    }
    if (transparentPixels < size * size * 0.02) {
      throw new Error(`${names[index]} 缺少透明留白，请重新生成真实透明背景。`);
    }
    // 按真实透明通道裁边，不按颜色去底，保留白瓷和半透明光晕。
    const bounds = alphaBounds(data, info.width, info.height, 1);
    // WebP 直接从生成像素缩至 640，避免标准 PNG 放大后再缩小的重复采样。
    const webp = await sharp(prop.data, {
      raw: { width: prop.bounds.width, height: prop.bounds.height, channels: 4 },
    })
      .resize({ width: 640, height: 640, fit: "inside" })
      .webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
    const final = await sharp(webp).metadata();
    const subject = alphaBounds(data, info.width, info.height, 128);
    outputs.push({ png, webp, entry: {
      名称: names[index], 位置: positions[index],
      来源: index === 2 && replacementSource ? "左下修正版原图.png" : "四宫格原图.png",
      生成像素范围: prop.bounds,
      独立PNG尺寸: { 宽: size, 高: size }, 裁边范围: bounds,
      主体边界: subject,
      入库尺寸: { 宽: final.width, 高: final.height },
      文件: `src/assets/explore-corridor/交互物/${names[index]}.webp`,
      文件字节数: webp.length,
    } });
  }
  // 四张全部成功编码后再写文件，保留来源及未裁边的独立 PNG。
  await mkdir(archive, { recursive: true });
  await mkdir(destination, { recursive: true });
  await copyFile(input, original);
  if (replacementSource) await copyFile(path.resolve(replacementSource), replacementArchive);
  for (let index = 0; index < outputs.length; index += 1) {
    const { png, webp, entry } = outputs[index];
    await writeFile(pngFiles[index], png, { flag: "wx" });
    await writeFile(webpFiles[index], webp, { flag: "wx" });
    console.log(`${entry.名称}：${entry.入库尺寸.宽}×${entry.入库尺寸.高}，${(webp.length / 1024).toFixed(1)} 千字节`);
  }
  const master = await sharp({ create: {
    width: 2048, height: 2048, channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  } }).composite(outputs.map(({ png }, index) => ({
    input: png, left: (index % 2) * size, top: Math.floor(index / 2) * size,
  }))).png().toBuffer();
  await writeFile(normalizedSheet, master, { flag: "wx" });
  await writeFile(manifest, JSON.stringify({
    批次: batch, 来源: "四宫格原图.png",
    原图尺寸: { 宽: metadata.width, 高: metadata.height },
    标准画布尺寸: { 宽: 2048, 高: 2048 },
    处理方式: "按完整透明主体分离；PNG 适配至 1024 正方形画布；WebP 从生成像素直接缩至最长边 640；质量 90；保留透明通道。",
    素材: outputs.map(({ entry }) => entry),
  }, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
}

main().catch((error) => {
  console.error(`素材入库失败：${error.message}`);
  process.exitCode = 1;
});
