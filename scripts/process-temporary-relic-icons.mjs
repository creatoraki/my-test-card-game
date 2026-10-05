// 将独立生成的一次性遗物原图转换为统一的透明 WebP，并保留原图与提示词记录。
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const manifestPath = process.argv[2];
if (!manifestPath) throw new Error("请提供包含素材名称、原图路径和提示词的清单路径。");
const entries = JSON.parse(await readFile(resolve(manifestPath), "utf8"));
const archiveDirectory = resolve("处理后的WebP素材/一次性遗物");
const outputDirectory = resolve("src/assets/遗物");
await mkdir(archiveDirectory, { recursive: true });
await mkdir(outputDirectory, { recursive: true });

const previews = [];
for (const [index, entry] of entries.entries()) {
  const source = resolve(entry.source);
  const metadata = await sharp(source).metadata();
  if (!metadata.hasAlpha) throw new Error(`${entry.name} 原图缺少透明通道。`);
  await copyFile(source, resolve(archiveDirectory, `${entry.name}.png`));
  const normalized = await sharp(source)
    .trim({ background: "#00000000", threshold: 8 })
    .resize(224, 224, { fit: "contain", background: "#00000000", kernel: "lanczos3" })
    .extend({ top: 16, bottom: 16, left: 16, right: 16, background: "#00000000" })
    .png().toBuffer();
  await sharp(normalized)
    .webp({ lossless: true, effort: 6, alphaQuality: 100 })
    .toFile(resolve(outputDirectory, `${entry.name}.webp`));
  previews.push({ input: normalized, left: (index % 4) * 256, top: Math.floor(index / 4) * 256 });
  console.log(`已保存：${entry.name}.webp（256×256，透明，无损）`);
}

await sharp({ create: { width: 1024, height: Math.ceil(entries.length / 4) * 256, channels: 4, background: "#182231" } })
  .composite(previews).png().toFile(resolve(archiveDirectory, "素材预览.png"));
await writeFile(resolve(archiveDirectory, "生成记录.md"), [
  "# 一次性遗物素材",
  "使用内置 image_gen 工具逐件生成。游戏素材为 256×256 透明无损 WebP，主体等比缩放至 224×224 范围，四边至少留白 16 像素。",
  ...entries.map((entry) => `## ${entry.name}\n\n素材：src/assets/遗物/${entry.name}.webp\n\n提示词：${entry.prompt}`),
].join("\n\n"), "utf8");
