// dev 服务器发送「内容哈希命名」的素材: 永久缓存 + Range 分段。
// img-optimize(压缩产物) 与 dev-asset-cache(原件直出) 共用, 两边的缓存语义必须一致。
import path from "node:path";

const MIME = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 * @param {Buffer} buf
 * @param {string} name 带扩展名的文件名, 只用来推断 Content-Type
 */
export function serveAssetBuffer(req, res, buf, name) {
  const type = MIME[path.extname(name).toLowerCase()] ?? "application/octet-stream";
  // 文件名就是内容哈希 ⇒ 内容一变 URL 必变, 可以放心长缓存:
  // 浏览器之后直接读本地缓存, 连「是否过期」的确认请求都不发。
  res.setHeader("Cache-Control", "max-age=31536000, immutable");
  res.setHeader("Content-Type", type);

  // <video> 会发 Range 请求做分段拉取与 seek; 只会整块回 200 的话
  // 浏览器行为在各家实现下并不一致(尤其 Safari 直接拒播)。
  res.setHeader("Accept-Ranges", "bytes");
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
  if (m) {
    const start = m[1] ? Number(m[1]) : 0;
    const end = m[2] ? Math.min(Number(m[2]), buf.length - 1) : buf.length - 1;
    if (start > end) {
      res.writeHead(416, { "Content-Range": `bytes */${buf.length}` });
      return res.end();
    }
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${buf.length}`,
      "Content-Length": end - start + 1,
    });
    return res.end(buf.subarray(start, end + 1));
  }

  res.setHeader("Content-Length", buf.length);
  res.end(buf);
}
