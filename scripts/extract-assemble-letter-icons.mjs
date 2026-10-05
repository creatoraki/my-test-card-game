// 按提取BUFF.ps1裁切第四行，保留黑色背景与完整圆角边框。
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const source = resolve('处理后的WebP素材/组装ABCD_红金青紫四组方案.png');
const archive = resolve('处理后的WebP素材/组装部件/第四行纯字母');
const output = resolve('src/assets/buffs/部件/组装');
const letters = ['A', 'B', 'C', 'D'];
const columns = [[13, 314], [322, 624], [632, 933], [941, 1241]];
const { width, height } = await sharp(source).metadata();
await mkdir(archive, { recursive: true });
const previews = [];

for (const [column, letter] of letters.entries()) {
  // 边框外保留少量余量，保留圆角的抗锯齿像素。
  const left = Math.round(columns[column][0] * width / 1254);
  const right = Math.round(columns[column][1] * width / 1254);
  const top = Math.round(927 * height / 1254);
  const bottom = Math.round(1226 * height / 1254);
  const original = await sharp(source)
    .extract({ left, top, width: right - left, height: bottom - top })
    .png().toBuffer();
  await writeFile(resolve(archive, `组装${letter}.png`), original);
  const normalized = await sharp(original)
    .resize(72, 72, { fit: 'fill', kernel: 'lanczos3' })
    .png().toBuffer();
  await sharp(normalized).webp({ lossless: true, effort: 6 })
    .toFile(resolve(output, `组装${letter}.webp`));
  previews.push({ input: await sharp(normalized).resize(288, 288).png().toBuffer(), left: column * 288, top: 0 });
  console.log(`已替换组装${letter}.webp：72×72无损WebP，保留背景及边框`);
}
await sharp({ create: { width: 1152, height: 288, channels: 4, background: '#182231' } })
  .composite(previews).png().toFile(resolve(archive, '素材预览.png'));
