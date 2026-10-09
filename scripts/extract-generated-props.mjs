// 将生图模型抠好的四宫格拆成独立 PNG，脚本不负责抠透明背景。
import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { alignProp, separateFourProps } from "./lib/transparent-prop-layout.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const defaultOutput = resolve(root, "生图模型输出目录/切图目录");
const usage = "用法：node scripts/extract-generated-props.mjs [--size 768] [--input 模型透明原图目录] [--output 切图目录] [--batch 批次名称] [--overwrite]";

function optionsFrom(args) {
  const options = { size: 768, output: defaultOutput, overwrite: false };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") { console.log(usage); return null; }
    if (argument === "--overwrite") { options.overwrite = true; continue; }
    if (!["--size", "--input", "--output", "--batch"].includes(argument) || !args[index + 1]) throw new Error(usage);
    const value = args[++index];
    options[argument.slice(2)] = argument === "--size" ? Number(value) : argument === "--batch" ? value : resolve(value);
  }
  if (!Number.isInteger(options.size) || options.size < 64 || options.size > 8192) throw new Error("画布边长必须是 64～8192 的整数。");
  if (options.batch && /[<>:"/\\|?*\x00-\x1f]/.test(options.batch)) throw new Error("批次名称不能包含路径分隔符或文件名禁用字符。");
  options.input ??= resolve(options.output, "模型抠图原图");
  options.bottomMargin = Math.round(options.size * 12 / 256);
  return options;
}

async function exists(path) {
  try { await access(path); return true; } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function main() {
  const options = optionsFrom(process.argv.slice(2));
  if (!options) return;
  if (options.input === options.output) throw new Error("模型透明原图目录与切图输出目录必须分开。");
  const files = (await readdir(options.input, { withFileTypes: true }))
    .filter((file) => file.isFile() && /\.(png|webp)$/i.test(file.name) && (!options.batch || file.name.includes(options.batch)))
    .map((file) => file.name)
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
  if (!files.length) throw new Error("模型透明原图目录中没有图片。");
  const positions = ["左上", "右上", "左下", "右下"];
  const tasks = files.map((name) => ({
    name,
    outputs: positions.map((position) => `${basename(name).replace(/\.[^.]+$/, "")}_${position}.png`),
  }));
  const allNames = tasks.flatMap((task) => task.outputs);
  const suffix = options.batch ? `_${options.batch}` : "";
  const manifestName = `切图清单${suffix}.json`;
  const descriptionName = `切图说明${suffix}.md`;
  const promptName = `模型抠图提示词${suffix}.txt`;
  const repeatCommand = `node scripts/extract-generated-props.mjs${options.batch ? ` --batch "${options.batch}"` : ""}`;
  if (new Set(allNames).size !== allNames.length) throw new Error("输入图片的基础文件名重复，会产生同名素材。");
  if (!options.overwrite) {
    for (const name of [...allNames, manifestName, descriptionName]) {
      if (await exists(resolve(options.output, name))) throw new Error(`文件已存在：${name}。需要重新导出时添加 --overwrite。`);
    }
  }
  await mkdir(options.output, { recursive: true });
  const entries = [];
  for (const task of tasks) {
    const inputPath = resolve(options.input, task.name);
    const sheet = await separateFourProps(inputPath);
    for (let index = 0; index < sheet.props.length; index += 1) {
      const prop = sheet.props[index];
      const aligned = await alignProp(prop, options.size, options.bottomMargin);
      await writeFile(resolve(options.output, task.outputs[index]), aligned.image);
      entries.push({
        文件: task.outputs[index], 模型透明原图: task.name, 位置: positions[index],
        原图尺寸: { 宽: sheet.width, 高: sheet.height }, 原图主体边界: prop.bounds,
        画布边长: options.size, 底部留白: options.bottomMargin, 输出主体边界: aligned.bounds,
      });
      console.log(`已导出：${task.outputs[index]}`);
    }
  }
  await writeFile(resolve(options.output, manifestName), JSON.stringify(entries, null, 2) + "\n", "utf8");
  await writeFile(resolve(options.output, descriptionName), [
    "# 四宫格独立素材", "",
    `共 ${tasks.length} 张四宫格，拆出 ${entries.length} 个独立透明 PNG。`, "",
    `画布统一为 ${options.size}×${options.size}，按实际透明边界水平居中，底部固定留白 ${options.bottomMargin} 像素。`,
    "留白比例为 12/256；上下左右安全空间均按这一比例设置，主体在可用范围内等比缩放。", "",
    "背景通过内置生图模型抠除，透明原图保存在“模型抠图原图”目录。脚本仅识别透明连通区域、分离素材并对齐画布。",
    "排版前清理透明度低于 8/255 的透明噪点，避免模型残留像素影响居中和底部留白。",
    `文件名保留来源及左上、右上、左下、右下位置，具体边界见“${manifestName}”。`, "",
    `重新导出：\`${repeatCommand} --overwrite\``, "",
    `导出 256×256（底部 12 像素）：\`${repeatCommand} --size 256 --overwrite\``, "",
    `抠图提示词见“${promptName}”。模型编辑可能产生细节变化，以原始四宫格为设计参考。`, "",
  ].join("\n"), "utf8");
  console.log(`完成：${entries.length} 个素材；${options.size}×${options.size}；底部留白 ${options.bottomMargin} 像素。`);
}

main().catch((error) => {
  console.error(`切图失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
