import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, "../..");
const distDir = join(projectDir, "dist");
const indexPath = join(distDir, "index.html");

function latestModification(path) {
  if (!existsSync(path)) return 0;
  const info = statSync(path);
  if (!info.isDirectory()) return info.mtimeMs;
  return readdirSync(path).reduce(
    (latest, name) => Math.max(latest, latestModification(join(path, name))),
    0,
  );
}

function main() {
  if (!existsSync(indexPath) || !existsSync(join(distDir, "assets"))) {
    throw new Error("缺少发布产物，请先自行运行 pnpm build，再执行打包命令。");
  }

  // 只打包现有产物，不调用构建或测试；拒绝把旧版本误当成当前版本发布。
  const inputs = [
    "src", "scripts/vite-plugin-image-optimize.mjs",
    "scripts/vite-plugin-dev-asset-cache.mjs", "scripts/lib",
    "index.html", "vite.config.ts", "tsconfig.json", "package.json",
    "pnpm-lock.yaml", "pnpm-workspace.yaml", ".env", ".env.local",
    ".env.production", ".env.production.local",
  ];
  const latestInput = Math.max(...inputs.map((path) => latestModification(join(projectDir, path))));
  if (latestInput > statSync(indexPath).mtimeMs) {
    throw new Error("dist 早于源码或配置，已停止打包。请先自行运行 pnpm build 更新发布产物。");
  }
  if (!readFileSync(indexPath, "utf8").includes('src="/neon-city/assets/')) {
    throw new Error("发布产物未使用 /neon-city/ 路径，请使用当前配置重新生成 dist。");
  }

  const version = new Date().toISOString().replace(/[-:.]/g, "");
  const outputDir = join(projectDir, "output", "deploy");
  const stagingDir = join(outputDir, version);
  const archivePath = join(outputDir, `neon-city-${version}.tar.gz`);
  mkdirSync(stagingDir, { recursive: true });
  cpSync(distDir, join(stagingDir, "site"), { recursive: true });
  const result = spawnSync("tar", [
    "-czf", archivePath, "-C", stagingDir, "site",
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("压缩失败，请确认本机 tar 命令可用。");

  // 入口脚本独立于压缩包，服务器无需手动解压就能一键部署。
  const deployScript = readFileSync(join(scriptDir, "deploy.sh"), "utf8")
    .replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  writeFileSync(join(outputDir, "deploy.sh"), deployScript, "utf8");

  console.log(`部署包已生成：\n${archivePath}`);
  console.log("请将压缩包和同目录的 deploy.sh 上传到服务器 /home/admin。");
  console.log("服务器一键部署命令：bash /home/admin/deploy.sh");
  console.log("后续步骤见 docs/deployment.md。");
  console.log("压缩包只包含静态网站；日常部署不修改或重载 Nginx。");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
