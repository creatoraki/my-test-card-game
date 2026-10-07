import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { locateBuffGrid } from "./lib/buff-grid.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artDirectory = path.join(root, "处理后的WebP素材");
const defaults = ["一", "二", "三"].map((number) => path.join(artDirectory, `生态方舟_BUFF_16格_模板${number}.png`));
const ecoNames = [
  "点名齐射_方案甲", "根网回灌_方案甲", "园丁庇护_方案甲", "受到庇护_方案甲",
  "孢子_方案甲", "寄生种荚_方案甲", "点名齐射_方案乙", "根网回灌_方案乙",
  "园丁庇护_方案乙", "受到庇护_方案乙", "孢子_方案乙", "寄生种荚_方案乙",
  "中毒", "虚弱", "致盲", "易伤",
];

function parseArguments(args) {
  const options = { rows: 4, columns: 4, output: path.join(artDirectory, "组装部件"),
    reference: path.join(artDirectory, "备用BUFF", "BUFF_01.png"), inputs: [], overwrite: false };
  const values = new Set(["rows", "columns", "output", "reference", "names", "inset"]);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") return { help: true };
    if (argument === "--overwrite") { options.overwrite = true; continue; }
    if (!argument.startsWith("--")) { options.inputs.push(path.resolve(argument)); continue; }
    const key = argument.slice(2);
    if (!values.has(key)) throw new Error(`未知参数：${argument}`);
    const value = args[++index];
    if (!value || value.startsWith("--")) throw new Error(`${argument} 缺少参数值。`);
    options[key] = ["rows", "columns", "inset"].includes(key) ? Number(value) : path.resolve(value);
  }
  for (const key of ["rows", "columns"]) {
    if (!Number.isInteger(options[key]) || options[key] < 1) throw new Error(`${key} 必须是正整数。`);
  }
  if (options.inset != null && (!Number.isInteger(options.inset) || options.inset < 0)) throw new Error("内缩像素必须是非负整数。");
  return options;
}

async function assertAvailable(destination, overwrite) {
  if (overwrite) return;
  try { await fs.access(destination); }
  catch (error) { if (error.code === "ENOENT") return; throw error; }
  throw new Error(`目标已存在：${destination}。如需覆盖，请显式添加 --overwrite。`);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(`用法：node scripts/extract-buff-grid.mjs [模板路径 ...] [选项]
无参数：切出生态方舟三张模板的全部 48 格。
--rows 行数              默认 4
--columns 列数           默认 4
--reference 参考图路径   自动读取输出尺寸和格式，默认备用BUFF/BUFF_01.png
--output 输出目录        默认处理后的WebP素材/组装部件
--names 名称文件         按行列顺序排列的字符串数组 JSON，各模板共用
--inset 内缩像素         手动按等分网格裁切；省略时自动定位蓝灰色格框
--overwrite              允许覆盖同名输出文件`);
    return;
  }
  const useDefaults = options.inputs.length === 0;
  const inputs = useDefaults ? defaults : options.inputs;
  const names = options.names ? JSON.parse(await fs.readFile(options.names, "utf8"))
    : useDefaults && options.rows === 4 && options.columns === 4 ? ecoNames : null;
  if (names && (!Array.isArray(names) || names.length !== options.rows * options.columns
    || names.some((name) => typeof name !== "string" || !name.trim()))) throw new Error("名称文件必须包含与格子数量一致的非空字符串数组。");
  const reference = await sharp(options.reference).metadata();
  if (!reference.width || !reference.height || !["png", "webp"].includes(reference.format)) throw new Error("参考图必须是有效的 PNG 或 WebP 图片。");
  const extension = reference.format;
  const plans = [];
  const destinations = new Set();
  for (const input of inputs) {
    await fs.access(input);
    const prefix = path.parse(input).name;
    for (let index = 0; index < options.rows * options.columns; index += 1) {
      const label = (names?.[index] ?? "BUFF").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");
      const filename = `${prefix}_${String(index + 1).padStart(2, "0")}_${label}.${extension}`;
      const destination = path.join(options.output, filename);
      if (destinations.has(destination.toLowerCase())) throw new Error(`输出文件名重复：${filename}`);
      destinations.add(destination.toLowerCase());
      plans.push({ input, index, filename, destination });
    }
  }
  const manifestPath = path.join(options.output, `${path.parse(inputs[0]).name}_切图清单.json`);
  for (const destination of [...destinations, manifestPath]) await assertAvailable(destination, options.overwrite);
  await fs.mkdir(options.output, { recursive: true });
  const manifest = { reference: options.reference, width: reference.width, height: reference.height,
    format: extension, background: "保留原图背景与圆角边框", entries: [] };
  for (const input of inputs) {
    const grid = await locateBuffGrid(input, options);
    for (const plan of plans.filter((entry) => entry.input === input)) {
      const crop = grid.crops[plan.index];
      let image = sharp(grid.data, { raw: { width: grid.width, height: grid.height, channels: 4 } })
        .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
        .resize(reference.width, reference.height, { fit: "fill", kernel: "lanczos3" });
      image = extension === "png" ? image.png() : image.webp({ lossless: true, effort: 6 });
      await image.toFile(plan.destination);
      manifest.entries.push({ source: input, ...crop, name: names?.[plan.index] ?? "BUFF", file: plan.filename });
    }
    console.log(`已处理：${path.basename(input)}，${grid.crops.length} 个图标。`);
  }
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`完成：${manifest.entries.length} 个 ${reference.width}×${reference.height} ${extension.toUpperCase()} 图标，输出到 ${options.output}`);
}

main().catch((error) => { console.error(`切图失败：${error.message}`); process.exitCode = 1; });
