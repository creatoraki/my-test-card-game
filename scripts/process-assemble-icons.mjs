// 将生图模型拆分的组装徽记归档，并转为项目统一的透明 WebP 图标。
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const letters = ["A", "B", "C", "D"];
const sourceDirectory = resolve("处理后的WebP素材/组装部件/高清原图");
const outputDirectory = resolve("src/assets/buffs/部件/组装");
const sources = process.argv.slice(2);
if (sources.length !== letters.length) {
  throw new Error("请依次提供组装 A、B、C、D 的独立透明图片路径。");
}
await mkdir(sourceDirectory, { recursive: true });
await mkdir(outputDirectory, { recursive: true });
const previews = [];
for (const [index, letter] of letters.entries()) {
  const source = resolve(sources[index]);
  const metadata = await sharp(source).metadata();
  if (!metadata.hasAlpha) throw new Error(`组装 ${letter} 原图缺少透明通道。`);
  await copyFile(source, resolve(sourceDirectory, `组装${letter}.png`));
  const normalized = await sharp(source)
    .trim({ background: "#00000000", threshold: 8 })
    .resize(64, 64, { fit: "contain", background: "#00000000", kernel: "lanczos3" })
    .extend({ top: 4, bottom: 4, left: 4, right: 4, background: "#00000000" })
    .png().toBuffer();
  await sharp(normalized).webp({ lossless: true, effort: 6, alphaQuality: 100 })
    .toFile(resolve(outputDirectory, `组装${letter}.webp`));
  previews.push({ input: await sharp(normalized).resize(288, 288).png().toBuffer(), left: index * 288, top: 0 });
  console.log(`已替换：组装${letter}.webp（72×72，透明，无损）`);
}
await sharp({ create: { width: 1152, height: 288, channels: 4, background: "#182231" } })
  .composite(previews).png().toFile(resolve(sourceDirectory, "组装图标预览.png"));
await writeFile(resolve(sourceDirectory, "处理说明.md"),
  "# 组装部件图标\n\n使用内置 image_gen 生图模型，以待处理目录中的 ABCD 四色边框原图为编辑目标，分别提取四个徽记。\n\n提示词：分别独立提取蓝色 A、金黄色 B、青色 C、紫色 D 及完整圆形发光边框；保留水晶切面、双层环、三角方位标记与颜色；移除其他图标及杂散噪点；居中、完整、真实透明背景，内部空隙透明，不增加文字或物体。\n\n游戏素材：72×72，主体等比缩放至 64×64 范围，四边至少 4 像素透明留白，无损 WebP，保留透明通道。最终文件位于 src/assets/buffs/部件/组装/组装A.webp 至组装D.webp，沿用 BUFF_ART 登记。\n", "utf8");
