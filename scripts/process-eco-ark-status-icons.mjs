import { readdir, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = resolve(root, "处理后的WebP素材/已确认");
const assetDirectory = resolve(root, "src/assets/buffs/状态");
const entries = [
  { name: "点名齐射", category: "信息标记" },
  { name: "根网回灌", category: "生命恢复" },
  { name: "园丁庇护", category: "伤害防护" },
  { name: "受到庇护", category: "伤害防护" },
  { name: "孢子", category: "触发联动" },
  { name: "寄生种荚", category: "触发联动" },
];

async function main() {
  const files = await readdir(sourceDirectory);
  const reference = await sharp(resolve(assetDirectory, "持续伤害/中毒.webp")).metadata();
  if (!reference.width || !reference.height) throw new Error("无法读取现有 BUFF 图标规格。");
  // 先核对全部选图，避免名称缺失或重复时仅处理了一部分。
  const selected = entries.map((entry) => {
    const matches = files.filter((file) => file.includes(`_${entry.name}_`) && /\.(png|webp)$/i.test(file));
    if (matches.length !== 1) throw new Error(`${entry.name} 必须恰好有一张已确认图片，当前为 ${matches.length} 张。`);
    return { ...entry, source: resolve(sourceDirectory, matches[0]) };
  });
  for (const entry of selected) {
    const destination = resolve(assetDirectory, entry.category, `${entry.name}.webp`);
    await mkdir(dirname(destination), { recursive: true });
    await sharp(entry.source)
      .resize(reference.width, reference.height, { fit: "fill", kernel: "lanczos3" })
      .webp({ lossless: true, effort: 6, alphaQuality: 100 })
      .toFile(destination);
    console.log(`已转换：${entry.name} → ${reference.width}×${reference.height} 无损 WebP`);
  }
}

main().catch((error) => { console.error(`素材处理失败：${error.message}`); process.exitCode = 1; });
