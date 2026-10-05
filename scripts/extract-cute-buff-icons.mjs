import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artDirectory = path.join(root, "处理后的WebP素材");
const outputDirectory = path.join(artDirectory, "待处理中");
const nameDocument = await fs.readFile(path.join(root, "docs", "BUFF名称清单.md"), "utf8");
const names = [...nameDocument.matchAll(/^\|\s*\d+\s*\|\s*([^|]+)\|/gm)]
  .map((match) => match[1].trim());
names.push(...["寒霜", "灼魂", "圣佑", "狂怒", "疾行", "沉默", "吸血", "护盾", "幸运", "混沌"]
  .map((name) => `备用·${name}`));
if (names.length !== 96) throw new Error(`名称清单数量不符：${names.length}`);
await fs.mkdir(outputDirectory, { recursive: true });

const manifest = [
  "# 萌系状态图标切图对照", "",
  "六组共 96 个图标，包含 86 个正式状态与 10 个备用图标。均为 72×72、无损 WebP，保留素材外边框。",
  "", "| 序号 | 名称 | 原图组别 | 行 | 列 | 文件 |", "| --- | --- | --- | --- | --- | --- |",
];

for (let group = 1; group <= 6; group += 1) {
  const source = path.join(artDirectory, `BUFF图标_第${String(group).padStart(2, "0")}组_统一萌系方案.png`);
  const { width, height } = await sharp(source).metadata();
  if (!width || !height) throw new Error(`无法读取图像尺寸：${source}`);
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const index = (group - 1) * 16 + row * 4 + column;
      // 四等分网格，只剔除格位外侧约 2px 留白，完整保留圆角描边。
      const inset = Math.max(1, Math.round(Math.min(width, height) / 627));
      const left = Math.round(column * width / 4) + inset;
      const top = Math.round(row * height / 4) + inset;
      const right = Math.round((column + 1) * width / 4) - inset;
      const bottom = Math.round((row + 1) * height / 4) - inset;
      const filename = `${String(index + 1).padStart(3, "0")}_${names[index]}.webp`;
      const destination = path.join(outputDirectory, filename);
      try {
        await fs.access(destination);
        throw new Error(`目标已存在，停止以免覆盖：${filename}`);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      await sharp(source)
        .extract({ left, top, width: right - left, height: bottom - top })
        .resize(72, 72, { fit: "fill", kernel: "lanczos3" })
        .webp({ lossless: true, effort: 6 })
        .toFile(destination);
      manifest.push(`| ${index + 1} | ${names[index]} | ${group} | ${row + 1} | ${column + 1} | ${filename} |`);
    }
  }
  console.log(`第 ${group} 组：已保存 16 个 72×72 WebP 图标。`);
}
await fs.writeFile(path.join(outputDirectory, "萌系图标切图对照.md"), manifest.join("\n") + "\n", "utf8");
console.log(`已完成 96 个图标：${outputDirectory}`);
