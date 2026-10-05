// 从实际素材目录查找唯一归属，处理脚本不再自行创建状态分类。
import { readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const assetRoot = fileURLToPath(new URL("../src/assets/buffs/", import.meta.url));
const paths = new Map();

function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (entry.name.endsWith(".webp")) {
      const name = basename(entry.name, ".webp");
      if (paths.has(name)) throw new Error(`素材名称重复：${name}`);
      paths.set(name, path);
    }
  }
}

collect(assetRoot);

export function buffAssetPath(name, extension = ".webp") {
  const path = paths.get(name);
  if (!path) throw new Error(`素材尚未分类登记：${name}`);
  return resolve(path.slice(0, -5) + extension);
}
