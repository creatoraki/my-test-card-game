// 将咒术师的六边框原图转为与现有状态图标一致的透明 WebP。
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const sourceDirectory = resolve("处理后的WebP素材/待处理/方案五_单主题色低反光/蚀刻六边框重制");
const outputDirectory = resolve("src/assets/buffs/hexer");
const names = ["厄运", "怨咒", "封印", "停摆", "附骨", "锁魂", "疫病", "咒丝", "反咒", "咒誓", "逢魔"];

await mkdir(outputDirectory, { recursive: true });
for (const name of names) {
  const source = resolve(sourceDirectory, `${name}.png`);
  const metadata = await sharp(source).metadata();
  if (!metadata.hasAlpha) throw new Error(`${name}原图缺少透明通道。`);
  await sharp(source)
    .trim({ background: "#00000000", threshold: 8 })
    .resize(64, 64, { fit: "contain", background: "#00000000", kernel: "lanczos3" })
    .extend({ top: 4, bottom: 4, left: 4, right: 4, background: "#00000000" })
    .webp({ lossless: true, effort: 6, alphaQuality: 100 })
    .toFile(resolve(outputDirectory, `${name}.webp`));
  console.log(`已转换：${name}.webp（72×72，透明，无损）`);
}
