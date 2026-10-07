import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 用法：node scripts/convert-messenger-art.mjs [PNG源目录]
// 输出匹配1080P面板展示尺寸，脚本不删除源图。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destination = path.join(root, "src/assets/羽翼信使面板");
const source = path.resolve(process.argv[2] ?? destination);
await mkdir(destination, { recursive: true });

// 物品图直接复用项目已有WebP，不再制作面板专用的食品图。
const jobs = ["城市背景", "机械信鸦与货箱"];
let before = 0;
let after = 0;
for (const name of jobs) {
  const input = path.join(source, `${name}.png`);
  const output = path.join(destination, `${name}.webp`);
  let pipeline;
  if (name === "城市背景") {
    pipeline = sharp(input).resize(1632, 918, { fit: "cover", withoutEnlargement: true });
  } else if (name === "机械信鸦与货箱") {
    // 等效于原有容器的 cover 与 object-position: center 22%。
    const resized = await sharp(input).resize({ width: 744 }).png().toBuffer();
    const metadata = await sharp(resized).metadata();
    const height = Math.min(234, metadata.height);
    const top = Math.round((metadata.height - height) * .22);
    pipeline = sharp(resized).extract({ left: 0, top, width: 744, height });
  }
  const info = await pipeline.webp({ quality: 85, alphaQuality: 100, effort: 6 }).toFile(output);
  before += (await stat(input)).size;
  after += info.size;
  console.log(`${name}：${info.width}×${info.height}，${(info.size / 1024).toFixed(1)} 千字节`);
}
console.log(`合计：${(before / 1024 / 1024).toFixed(2)} → ${(after / 1024 / 1024).toFixed(2)} 兆字节，减少 ${(100 * (1 - after / before)).toFixed(1)}%`);
