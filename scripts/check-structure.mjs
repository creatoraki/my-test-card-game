// 目录结构规范检查: node scripts/check-structure.mjs
// 规范见 README「目录规范」一节。有违规时以非 0 退出。
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("src");
const MAX_GROUPS = 12;
// 模块目录允许携带的特殊子目录
const SPECIAL_DIRS = new Set(["parts", "styles", "__tests__"]);
// 容器目录允许携带的文件
const CONTAINER_FILES = new Set(["index.ts", "types.ts"]);
const CODE_RE = /\.(ts|tsx|css)$/;
// 豁免: 路径 -> 原因
const EXEMPT = {
  ".": "应用入口(App.tsx / main.tsx / vite-env.d.ts)",
};

const toPosix = (p) => p.split(path.sep).join("/");
const groupOf = (name) => name.replace(/(\.module\.css|\.d\.ts|\.tsx|\.ts|\.css)$/, "");
const problems = [];

function check(dir) {
  const rel = toPosix(path.relative(SRC, dir)) || ".";
  if (rel === "assets") return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const plainDirs = dirs.filter((d) => !SPECIAL_DIRS.has(d));
  const exempt = rel in EXEMPT;

  for (const f of files) if (!CODE_RE.test(f)) problems.push(`[非代码文件] ${rel}/${f} —— 文档请放到 docs/`);

  if (!exempt && plainDirs.length > 0) {
    const loose = files.filter((f) => !CONTAINER_FILES.has(f));
    if (loose.length) problems.push(`[混放] ${rel} —— 有子目录 ${plainDirs.length} 个, 同时散落文件: ${loose.join(" ")}`);
  }

  const groups = new Set(files.filter((f) => CODE_RE.test(f)).map(groupOf));
  if (!exempt && groups.size > MAX_GROUPS) problems.push(`[平铺过多] ${rel} —— ${groups.size} 组(上限 ${MAX_GROUPS})`);

  for (const d of dirs) {
    const twin = files.find((f) => groupOf(f) === d && /\.(ts|tsx)$/.test(f));
    if (twin) problems.push(`[同名并存] ${rel}/${twin} 与 ${rel}/${d}/`);
  }

  const base = path.basename(dir);
  // 组件包 = 带 index.ts 出口、且含大驼峰 .tsx 组件的目录, 目录名须为大驼峰
  const hasComponent = files.some((f) => /^[A-Z].*\.tsx$/.test(f));
  const mainTsx = files.find((f) => f.toLowerCase() === base.toLowerCase() + ".tsx");
  if (mainTsx && groupOf(mainTsx) !== base) problems.push(`[命名] ${rel} —— 目录名与组件 ${mainTsx} 大小写不一致`);
  else if (hasComponent && files.includes("index.ts") && /^[a-z]/.test(base) && !SPECIAL_DIRS.has(base))
    problems.push(`[命名] ${rel} —— 组件包目录应使用大驼峰`);

  for (const d of dirs) check(path.join(dir, d));
}

check(SRC);

if (problems.length) {
  console.log(`目录结构检查未通过, 共 ${problems.length} 处:`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log("目录结构检查通过");
