// 从确认的平底修正版导出四个独立透明素材，不缩放、不重新生成。
import { access, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { separateCurioSheet } from "./lib/curio-sheet-separation.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = resolve(root, "生图模型输出目录/奇物");
const names = ["旅人战术背包", "空投补给舱", "密码寄存柜", "环锁密匣"];
const usage = "用法：node scripts/extract-curio-sheet.mjs [--input 原图路径] [--output 输出目录] [--names 左上名称,右上名称,左下名称,右下名称] [--padding 8] [--overwrite]";

function parseOptions(args) {
  const options = {
    input: resolve(directory, "通用素材_前四个_四宫格_精致手游版_平底修正版.png"),
    output: resolve(directory, "切图结果"), names, padding: 8, overwrite: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") { console.log(usage); return null; }
    if (argument === "--overwrite") { options.overwrite = true; continue; }
    if (!["--input", "--output", "--padding", "--names"].includes(argument) || !args[index + 1]) {
      throw new Error(usage);
    }
    const value = args[++index];
    if (argument === "--names") {
      options.names = value.split(/[,，]/u).map((name) => name.trim());
      continue;
    }
    options[argument.slice(2)] = argument === "--padding" ? Number(value) : resolve(value);
  }
  if (!Number.isInteger(options.padding) || options.padding < 0 || options.padding > 256) {
    throw new Error("透明留白必须是 0～256 的整数。");
  }
  if (options.names.length !== 4 || new Set(options.names).size !== 4
    || options.names.some((name) => !name || /[<>:"/\\|?*\u0000-\u001f]/u.test(name)
      || /[. ]$/u.test(name) || name === "切图清单")) {
    throw new Error("请提供四个不同的合法素材名称，按左上、右上、左下、右下顺序，用逗号分隔。");
  }
  return options;
}

async function ensureOutputsAvailable(paths, overwrite) {
  if (overwrite) return;
  for (const path of paths) {
    try { await access(path); } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    throw new Error(`文件已存在：${path}；重新导出需添加 --overwrite。`);
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (!options) return;
  const outputs = options.names.map((name) => resolve(options.output, `${name}.png`));
  const manifestPath = resolve(options.output, "切图清单.json");
  if ([...outputs, manifestPath].includes(options.input)) throw new Error("输出不能覆盖原图。");
  await ensureOutputsAvailable([...outputs, manifestPath], options.overwrite);
  const sheet = await separateCurioSheet(options.input, options.padding);
  // 全部先编码成功，再开始写入文件，识别失败不会产生部分导出。
  const images = await Promise.all(sheet.props.map((prop) => sharp(prop.data, {
    raw: { width: prop.width, height: prop.height, channels: 4 },
  }).png().toBuffer()));
  await mkdir(options.output, { recursive: true });
  const entries = [];
  for (let index = 0; index < sheet.props.length; index += 1) {
    const prop = sheet.props[index];
    await writeFile(outputs[index], images[index], { flag: options.overwrite ? "w" : "wx" });
    entries.push({
      名称: options.names[index], 文件: `${options.names[index]}.png`, 位置: prop.position,
      原图边界: prop.sourceBounds, 输出尺寸: { 宽: prop.width, 高: prop.height },
      保留像素数: prop.pixels,
    });
    console.log(`已导出：${options.names[index]}.png（${prop.width}×${prop.height}）`);
  }
  await writeFile(manifestPath, JSON.stringify({
    原图: options.input, 原图尺寸: { 宽: sheet.width, 高: sheet.height },
    透明留白: options.padding, 主体识别透明度: sheet.coreAlpha,
    保留边缘最低透明度: sheet.edgeAlpha,
    忽略透明噪点及孤立碎点像素数: sheet.ignoredPixels,
    处理方式: "实心主体识别、半透明边缘归属、独立像素遮罩、原尺寸裁紧；未缩放。",
    素材: entries,
  }, null, 2) + "\n", { encoding: "utf8", flag: options.overwrite ? "w" : "wx" });
  console.log(`切图完成：${options.output}`);
}

main().catch((error) => {
  console.error(`切图失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
