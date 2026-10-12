// Vite 插件(仅 dev): 让美术素材在浏览器里长期缓存, 只有素材改动时才重新下载。
//
// 问题: Vite dev 原生按源码路径(/src/assets/xxx.webp)提供素材, 响应头是 no-cache ——
// 浏览器虽留着本地副本, 但每次开屏都要逐个向服务器确认「改没改」。600 多张图就是 600 多个往返,
// 走 cloudflare 隧道时尤其慢。
//
// 做法: 素材 import 改写成 /@asset/<内容哈希>.<扩展名>, 响应头 immutable。
// - 素材没改: URL 不变 → 浏览器直接读本地缓存, 不发任何请求。
// - 素材改了 / 新增: 内容哈希变 → 新 URL → 只下载这一件。
// - 素材删了: 旧 URL 再也没人请求, 由浏览器缓存按容量自行淘汰, 无需手动清理。
//
// 必须排在 img-optimize 之后、同为 enforce: "pre": 被它压缩的 PNG/视频已有哈希 URL;
// 它放行的(WebP 原件、压缩后反而更大的、OPTIMIZE=0 时的全部)再由这里接手。
// build 不介入 —— Vite 构建产物的文件名本就带内容哈希, 缓存策略交给部署服务器的响应头。
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { serveAssetBuffer } from "./lib/serveAssetBuffer.mjs";

const ASSET_TARGET = /\.(webp|png|jpe?g|gif|avif|mp4|webm|mov)$/i;
// ?raw 要源码文本、?inline 要 base64 内联, 语义不是「拿 URL」, 放行给 Vite。
const BYPASS_QUERY = /[?&](raw|inline)\b/;
const PREFIX = "/@asset/";

/**
 * @returns {import("vite").Plugin}
 */
export default function devAssetCache() {
  // 哈希文件名 → 源文件路径。只存路径不存内容: 600 多张原件常驻内存没有必要。
  const served = new Map();

  return {
    name: "dev-asset-cache",
    apply: "serve",
    enforce: "pre",

    async load(id) {
      if (BYPASS_QUERY.test(id)) return null;
      const filePath = id.split("?")[0];
      if (!ASSET_TARGET.test(filePath) || !existsSync(filePath)) return null;

      const source = await readFile(filePath);
      const key = createHash("sha1").update(source).digest("hex").slice(0, 16);
      const name = `${key}${path.extname(filePath).toLowerCase()}`;
      served.set(name, filePath);
      return `export default ${JSON.stringify(`${PREFIX}${name}`)}`;
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(PREFIX)) return next();
        const name = path.basename(req.url.split("?")[0]);
        const filePath = served.get(name);
        if (!filePath) return next();
        try {
          serveAssetBuffer(req, res, await readFile(filePath), name);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
