import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 用法：node scripts/convert-curio-art.mjs [PNG源目录] [WebP输出目录]
// 把奇物最终切图（透明 PNG）裁去透明边后转成 WebP，默认输出到通用交互物目录，脚本不删除源图。
// 末尾打印每张图的尺寸与主体上下边界，供 ui/art/corridor/commonPropArt.ts 登记。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(process.argv[2] ?? path.join(root, "生图模型输出目录/奇物/切图结果"));
const destination = path.resolve(process.argv[3] ?? path.join(root, "src/assets/explore-corridor/通用交互物"));
/** 透明度低于此值的像素视为留白，裁边时去掉。 */
const TRIM_ALPHA = 8;
/** 主体边界取透明度不低于此值的像素，避免半透明光晕把落地线往下拉。 */
const SUBJECT_ALPHA = 128;
/** 裁边后四周保留的透明像素，防止缩放采样切掉描边。 */
const PADDING = 2;

/** 返回透明度达到阈值的像素外接框；全透明时返回 null。 */
function alphaBox(data, width, height, threshold) {
  let left = width, right = -1, top = height, bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < threshold) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  return right < 0 ? null : { left, right, top, bottom };
}

await mkdir(destination, { recursive: true });
const files = (await readdir(source)).filter((name) => name.toLowerCase().endsWith(".png")).sort((a, b) => a.localeCompare(b, "zh-CN"));
if (!files.length) throw new Error(`源目录中没有 PNG：${source}`);

const report = [];
let before = 0;
let after = 0;
for (const file of files) {
  const input = path.join(source, file);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const box = alphaBox(data, info.width, info.height, TRIM_ALPHA);
  if (!box) throw new Error(`${file} 是全透明图片`);
  const left = Math.max(0, box.left - PADDING);
  const top = Math.max(0, box.top - PADDING);
  const width = Math.min(info.width, box.right + PADDING + 1) - left;
  const height = Math.min(info.height, box.bottom + PADDING + 1) - top;
  const subject = alphaBox(data, info.width, info.height, SUBJECT_ALPHA);
  const name = file.replace(/\.png$/i, "");
  const output = path.join(destination, `${name}.webp`);
  const written = await sharp(input)
    .extract({ left, top, width, height })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(output);
  before += (await stat(input)).size;
  after += written.size;
  report.push({ name, width, height, top: subject.top - top, bottom: subject.bottom - top + 1 });
  console.log(`${name}：${width}×${height}，${(written.size / 1024).toFixed(1)} 千字节`);
}
console.log(`合计：${(before / 1024 / 1024).toFixed(2)} → ${(after / 1024 / 1024).toFixed(2)} 兆字节`);
console.log("\n主体边界（commonPropArt.ts 登记用）：");
for (const item of report) {
  console.log(`${item.name}  { width: ${item.width}, height: ${item.height}, top: ${item.top}, bottom: ${item.bottom} }`);
}
