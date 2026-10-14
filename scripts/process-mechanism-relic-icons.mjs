// 整理独立原图或图集切片，保留真实透明通道并输出游戏图标与中文总览。
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const manifestPath = process.argv[2];
if (!manifestPath) throw new Error("请提供包含名称、原图路径和提示词的素材清单。");
const entries = JSON.parse(await readFile(resolve(manifestPath), "utf8"));
const outputDirectory = resolve("src/assets/遗物");
const archiveDirectory = resolve("处理后的WebP素材/机制联动遗物");
const documentPath = resolve("design/遗物/机制联动遗物素材生成记录.md");
await mkdir(outputDirectory, { recursive: true });
await mkdir(archiveDirectory, { recursive: true });

async function saveNewOrIdentical(path, buffer) {
  try {
    const previous = await readFile(path);
    if (!previous.equals(buffer)) throw new Error(`已有不同内容的素材，请先选择新版本文件名：${path}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeFile(path, buffer, { flag: "wx" });
  }
}

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]);
}

const columns = 6;
const cellWidth = 256;
const cellHeight = 296;
const previewLayers = [];
const labels = [];
for (const [index, entry] of entries.entries()) {
  if (!entry.source || !entry.name || !entry.prompt) throw new Error("素材清单必须包含名称、原图路径和提示词。");
  const original = await readFile(resolve(entry.source));
  const metadata = await sharp(original).metadata();
  const statistics = await sharp(original).stats();
  if (!metadata.hasAlpha || statistics.channels.at(-1).min === 255) {
    throw new Error(`${entry.name} 原图没有真实透明背景，请重新生成。`);
  }
  await saveNewOrIdentical(resolve(archiveDirectory, `${entry.name}.png`), original);
  const normalized = await sharp(original)
    .trim({ background: "#00000000", threshold: 8 })
    .resize(224, 224, { fit: "contain", background: "#00000000", kernel: "lanczos3" })
    .extend({ top: 16, bottom: 16, left: 16, right: 16, background: "#00000000" })
    .png().toBuffer();
  const webp = await sharp(normalized).webp({ lossless: true, effort: 6, alphaQuality: 100 }).toBuffer();
  await saveNewOrIdentical(resolve(outputDirectory, `${entry.name}.webp`), webp);
  const left = (index % columns) * cellWidth;
  const top = Math.floor(index / columns) * cellHeight;
  previewLayers.push({ input: normalized, left, top });
  labels.push(`<text x="${left + 128}" y="${top + 278}" text-anchor="middle">${escapeXml(entry.name)}</text>`);
  console.log(`已整理：${entry.name}.webp（256×256，透明，无损）`);
}

const width = columns * cellWidth;
const height = Math.ceil(entries.length / columns) * cellHeight;
const labelLayer = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <g font-family="Microsoft YaHei, SimHei, sans-serif" font-size="24" fill="#f2e8d5">${labels.join("")}</g>
</svg>`);
await sharp({ create: { width, height, channels: 4, background: "#182231" } })
  .composite([...previewLayers, { input: labelLayer, left: 0, top: 0 }])
  .webp({ quality: 92, effort: 6 }).toFile(resolve(archiveDirectory, "素材总览.webp"));

const archivedEntries = entries.map((entry) => ({
  ...entry, source: resolve(archiveDirectory, `${entry.name}.png`),
}));
await writeFile(resolve(archiveDirectory, "素材清单.json"), `${JSON.stringify(archivedEntries, null, 2)}\n`, "utf8");
await writeFile(documentPath, [
  "# 机制联动遗物素材生成记录",
  `来源：[采用的机制联动遗物](采用的机制联动遗物.md)。共 ${entries.length} 件，使用内置 image_gen 工具生成。其中 ${entries.filter((entry) => !entry.sheetSource).length} 件独立生成，${entries.filter((entry) => entry.sheetSource).length} 件使用图集生成后由 Python 切图。`,
  "## 素材规范",
  "游戏素材为 256×256 透明无损 WebP；主体等比缩放至 224×224 范围，四边至少留白 16 像素。沿用现有遗物的手绘道具风格，物件完整，无文字、数字、字母及界面边框。透明背景来自模型原始透明通道。",
  "游戏图标目录：`src/assets/遗物/`。原图、中文总览和清单归档：`处理后的WebP素材/机制联动遗物/`。归档目录沿用项目现有忽略规则，游戏素材和本记录可纳入版本管理。",
  "## 素材清单",
  "| 名称 | 游戏素材 | 状态 |\n| --- | --- | --- |",
  ...entries.map((entry) => `| ${entry.name} | [${entry.name}.webp](../../src/assets/遗物/${entry.name}.webp) | 素材已生成 |`),
  "## 生成提示词",
  ...entries.map((entry) => `### ${entry.name}\n\n${entry.sheetSource ? `生成方式：图集生成，Python 按象限切图；列 ${entry.slot[0] + 1}，行 ${entry.slot[1] + 1}。\n\n` : ""}${entry.prompt}`),
  "## 重新整理",
  "在项目根目录执行：\n\n```powershell\nnode scripts/process-mechanism-relic-icons.mjs \"处理后的WebP素材/机制联动遗物/素材清单.json\"\n```\n\n脚本允许重复整理相同素材；遇到同名但内容不同的游戏素材时会停止，避免覆盖已有美术。",
].join("\n\n"), "utf8");
