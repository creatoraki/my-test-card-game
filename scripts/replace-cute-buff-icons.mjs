import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "src/assets/buffs");
const sourceRoot = path.join(root, "处理后的WebP素材/待处理中");
const targets = new Map();
for (const moduleName of ["statusArt", "hexerStatusArt", "additionalStatusArt"]) {
  const source = await fs.readFile(path.join(root, `src/ui/art/battle/${moduleName}.ts`), "utf8");
  for (const match of source.matchAll(/from "@\/assets\/buffs\/([^"]+\.webp)"/g)) {
    targets.set(path.basename(match[1], ".webp"), path.join(assetRoot, match[1]));
  }
}

const filenames = (await fs.readdir(sourceRoot)).filter((name) => /^\d{3}_.+\.webp$/.test(name)).sort();
if (filenames.length !== 96) throw new Error(`待处理素材应为 96 个，实际 ${filenames.length}`);
// 先确认所有格位都有目标路径，再执行移动替换。
const jobs = filenames.map((filename) => {
  const name = filename.replace(/^\d{3}_/, "").replace(/\.webp$/, "");
  const destination = name === "备用·护盾"
    ? path.join(assetRoot, "备选", "备用·护盾.webp")
    : name.startsWith("备用·")
      ? path.join(assetRoot, "备选", `${name}.webp`)
      : targets.get(name);
  if (!destination) throw new Error(`没有匹配到状态素材目录：${name}`);
  if (!path.resolve(destination).startsWith(assetRoot + path.sep)) throw new Error("目标超出素材目录");
  return { name, source: path.join(sourceRoot, filename), destination };
});
const manifest = ["# 萌系状态图标替换记录", "", "共移动 96 张 72×72 WebP：86 个正式状态、1 个护盾图标、9 个备用图标。", "", "| 名称 | 目标路径 |", "| --- | --- |"];
for (const job of jobs) {
  await fs.mkdir(path.dirname(job.destination), { recursive: true });
  await fs.copyFile(job.source, job.destination);
  await fs.unlink(job.source);
  manifest.push(`| ${job.name} | ${path.relative(root, job.destination).replaceAll("\\", "/")} |`);
}
await fs.writeFile(path.join(sourceRoot, "萌系图标替换记录.md"), manifest.join("\n") + "\n", "utf8");
console.log(`已移动并替换 ${jobs.length} 张图标至 ${assetRoot}`);
