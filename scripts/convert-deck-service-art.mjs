import sharp from "sharp";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 用法：node scripts/convert-deck-service-art.mjs [原始 PNG 目录] [--replace]
// 保留原图；仅负责透明留白整理、尺寸导出及文档要求的前景裁层。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const replace = args.includes("--replace");
const source = path.resolve(args.find(arg => arg !== "--replace") ?? path.join(root, "生图模型输出目录/换卡面板"));
const destination = path.join(root, "src/assets/换卡面板");
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const jobs = [
  { name: "面板外壳", width: 1920, height: 1080, preserveCanvas: true },
  { name: "重换舱", width: 1056, height: 920, paddingX: 16, paddingY: 8 },
  { name: "页签_常态", width: 480, height: 114, paddingX: 3, paddingY: 3 },
  { name: "页签_激活", width: 480, height: 114, paddingX: 3, paddingY: 3 },
  { name: "按钮_放弃", width: 448, height: 134, paddingX: 4, paddingY: 4 },
  { name: "按钮_确认", width: 544, height: 164, paddingX: 8, paddingY: 8 },
];

await mkdir(destination, { recursive: true });
// 不隐式覆盖美术文件，重新导出时请先自行备份或移走已有目标。
for (const name of replace ? [] : [...jobs.map(job => job.name), "重换舱_前层"]) {
  try {
    await access(path.join(destination, `${name}.webp`));
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  throw new Error(`目标文件已存在：${name}.webp`);
}
if (!replace) try {
  await access(path.join(source, "重换舱_前层.png"));
  throw new Error("目标文件已存在：重换舱_前层.png");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

function alphaBounds(data, width, height, threshold = 8) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= threshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left) throw new Error("原图没有可见内容");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function normalize(job) {
  const input = path.join(source, `${job.name}.png`);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bounds = job.preserveCanvas
    ? { left: 0, top: 0, width: info.width, height: info.height }
    : alphaBounds(data, info.width, info.height);
  const paddingX = job.paddingX ?? 0;
  const paddingY = job.paddingY ?? 0;
  return sharp(data, { raw: info })
    .extract(bounds)
    .resize(job.width - paddingX * 2, job.height - paddingY * 2, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .extend({ left: paddingX, right: paddingX, top: paddingY, bottom: paddingY, background: transparent })
    .png()
    .toBuffer();
}

async function writeWebp(name, png) {
  // 全部有损编码控制体积(舱体无损约 1MB → 有损约 290 千字节); 舱体与前层同质量编码, 重叠处色差肉眼不可见。
  const info = await sharp(png).webp({ quality: name.startsWith("重换舱") ? 92 : 94, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toFile(path.join(destination, `${name}.webp`));
  console.log(`${name}：${info.width}×${info.height}，${(info.size / 1024).toFixed(1)} 千字节`);
}

// 蒙版与完整舱体共用同一画布和像素，前层不再裁切或缩放。
function frontMask(x, y) {
  const horizontal = Math.max(0, Math.min(1, (x - 190) / 22, (876 - x) / 22));
  if (horizontal === 0) return 0;
  const upperEdge = 110 + 20 * (1 - ((x - 528) / 330) ** 2);
  const upper = Math.max(0, Math.min(1, (y - 56) / 6, (upperEdge - y) / 5));
  const lowerEdge = 806 - 24 * (1 - ((x - 528) / 340) ** 2);
  const lower = Math.max(0, Math.min(1, (y - lowerEdge) / 6));
  return horizontal * Math.max(upper, lower);
}

for (const job of jobs) {
  const png = await normalize(job);
  await writeWebp(job.name, png);
  if (job.name !== "重换舱") continue;
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = (y * info.width + x) * 4 + 3;
      data[alpha] = Math.round(data[alpha] * frontMask(x, y));
      if (data[alpha] === 0) {
        data[alpha - 3] = 0;
        data[alpha - 2] = 0;
        data[alpha - 1] = 0;
      }
    }
  }
  const front = await sharp(data, { raw: info }).png().toBuffer();
  await sharp(front).toFile(path.join(source, "重换舱_前层.png"));
  await writeWebp("重换舱_前层", front);
}
