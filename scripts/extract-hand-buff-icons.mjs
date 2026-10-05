import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, "处理后的WebP素材/待处理中/手牌BUFF补充");
const source = path.join(directory, "手牌BUFF图标_统一萌系方案.png");
const entries = [
  ["剑冢", "swordMound", "剑冢.webp"],
  ["多米诺", "domino", "多米诺.webp"],
  ["彗尾", "cometTail", "彗尾.webp"],
  ["心眼", "mindsEye", "心眼.webp"],
  ["星契", "starPact", "星契.webp"],
  ["沉重", "heavy", "沉重.webp"],
  ["流光", "streamer", "流光.webp"],
  ["灼热", "scorching", "灼热.webp"],
  ["神眼", "divineSight", "神眼.webp"],
  ["纳刀", "noto", "纳刀.webp"],
  ["逆流", "countercurrent", "逆流.webp"],
  ["培育中", "cultivate", "培育.webp"],
  ["培育成熟（过熟共用）", "CultivatedEmblem", "现有 SVG 图标"],
];
const { width, height } = await sharp(source).metadata();
if (!width || !height) throw new Error("无法读取手牌图集尺寸");
const document = [
  "# 手牌 BUFF 素材清单与切图对照", "",
  "来源：HandCard/parts/CardMarks.tsx、cardMarkArt.ts、buffArt.ts。",
  "已阅读上级目录的《萌系图标替换记录》《萌系图标切图对照》；原 96 张素材不包含以下手牌图标。",
  "本次补充 11 个卡牌标记、培育中、成熟/过熟共用图标，共 13 张。",
  "组装部件和魔药不属于 CardMarks 的手牌图标，不在本次补充范围内。",
  "成熟与过熟目前使用同一个 SVG 花朵；嫁接仅改变提示，没有独立图标。",
  "", "生成使用内置 imagegen：图 1 为萌系画风参考，图 2 为圆角边框和四列网格模板。",
  "图集为四列四行，末三格为空；切图均为 72×72 无损 WebP，保留圆角外框。",
  "素材在本目录待处理，尚未替换游戏中的引用。", "",
  "| 名称 | 标记或组件 | 当前素材（src/assets/buffs/buffs 下） | 行 | 列 | 新素材 |",
  "| --- | --- | --- | --- | --- | --- |",
];
for (const [index, [name, id, old]] of entries.entries()) {
  const row = Math.floor(index / 4);
  const column = index % 4;
  const inset = Math.max(1, Math.round(Math.min(width, height) / 627));
  const left = Math.round(column * width / 4) + inset;
  const top = Math.round(row * height / 4) + inset;
  const right = Math.round((column + 1) * width / 4) - inset;
  const bottom = Math.round((row + 1) * height / 4) - inset;
  const filename = `${String(index + 1).padStart(2, "0")}_${index === 12 ? "培育成熟" : name}.webp`;
  await sharp(source)
    .extract({ left, top, width: right - left, height: bottom - top })
    .resize(72, 72, { kernel: "lanczos3" })
    .webp({ lossless: true, effort: 6 })
    .toFile(path.join(directory, filename));
  document.push(`| ${name} | ${id} | ${old} | ${row + 1} | ${column + 1} | ${filename} |`);
}
await fs.writeFile(path.join(directory, "手牌BUFF素材清单.md"), document.join("\n") + "\n", "utf8");
console.log("已保存 13 张手牌 BUFF 切图与清单。");
