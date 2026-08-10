// Vite 插件: 在模块加载那一刻把 PNG/JPEG 转成 WebP、把视频重编码降码率。
// 素材源文件原样不动 —— PS 导出 PNG、剪辑导出 MP4 的工作流不受影响,
// 仓库里始终是高质量原件, 压缩只是构建产物的形态。
//
// 为什么 dev 也转: 场景大图的色带、透明立绘的 alpha 边缘、视频的码率损失都是肉眼可见的。
// 若只在 build 转, 开发时看到的画质和玩家看到的不是同一份, 表现问题要等发布后才暴露。
// 代价是首次启动得转一遍全量素材(视频尤其慢) —— 用内容哈希缓存到 node_modules/.cache 抵消,
// 之后只转改动过的那几件, 启动速度与不开优化时无异。
//
// OPTIMIZE=0 pnpm dev 整个跳过, 走 Vite 原生资源处理 —— 原画验收、或缓存出问题时的逃生口。
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const IMAGE_TARGET = /\.(png|jpe?g)$/i;
const VIDEO_TARGET = /\.(mp4|webm|mov)$/i;

// ?raw 要源码文本、?inline 要 base64 内联, 两者的调用方都对拿到的东西有具体预期,
// 换格式会改变语义。这类 import 一律放行给 Vite。
const BYPASS_QUERY = /[?&](raw|inline)\b/;

const CACHE_DIR = path.resolve("node_modules/.cache/img-optimize");
const DEV_PREFIX = "/@img-opt/";

const MIME = { ".webp": "image/webp", ".mp4": "video/mp4" };

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)}MB`;

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    proc.stderr.on("data", (d) => (err += d));
    // ENOENT 走这里 —— 机器上没装 ffmpeg 时的信号。
    proc.on("error", reject);
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err.slice(-800)))));
  });
}

/**
 * @returns {import("vite").Plugin}
 */
export default function imageOptimize({
  quality = 88,
  effort = 6,
  crf = 23,
  preset = "medium",
  maxWidth = 1920,
} = {}) {
  const enabled = process.env.OPTIMIZE !== "0";
  if (!enabled) {
    console.log("[img-optimize] OPTIMIZE=0 → 跳过压缩, 使用原始素材");
  }

  // dev 期的产物查表: 内容哈希 → buffer, 由下面的中间件按 URL 取回。
  const served = new Map();
  const stats = { img: 0, video: 0, skipped: 0, before: 0, after: 0 };
  let sharp;
  let isBuild = false;
  let reportTimer = null;
  // 一旦确认 ffmpeg 不可用就别再反复 spawn 失败 —— 队友/CI 机器上没装是正常情况,
  // 视频原样通过即可, 不该因此让构建失败。
  let ffmpegOk = null;

  // 视频转码吃满 CPU, 并发跑只会互相拖慢。串成一条链, 一个一个来。
  let chain = Promise.resolve();
  const serial = (task) => {
    const run = chain.then(task, task);
    chain = run.then(
      () => {},
      () => {},
    );
    return run;
  };

  // dev 下转换是懒的(模块被 import 到才转), 没有 buildEnd 这种收口时机,
  // 用防抖在"一阵转换停下来"之后汇报一次。
  const scheduleReport = () => {
    if (isBuild) return;
    clearTimeout(reportTimer);
    reportTimer = setTimeout(report, 500);
    reportTimer.unref?.();
  };

  const report = () => {
    if (stats.img + stats.video === 0) return;
    const saved = stats.before - stats.after;
    const pct = ((saved / stats.before) * 100).toFixed(1);
    console.log(
      `[img-optimize] 图片 ${stats.img} 张 + 视频 ${stats.video} 个: ${mb(stats.before)} → ${mb(stats.after)} ` +
        `(省 ${mb(saved)}, ${pct}%)${stats.skipped ? `, ${stats.skipped} 件因压缩后更大而保留原件` : ""}`,
    );
  };

  /** 内容哈希 + 转换参数: 改素材必然换 key, 调参数也必然换 key, 缓存不会喂旧货。 */
  const cacheKey = (source, params) =>
    createHash("sha1").update(source).update(params).digest("hex").slice(0, 16);

  async function toWebp(source) {
    // 首次用到才加载 sharp: 全量命中缓存时这个 native 模块根本不必进内存。
    sharp ??= (await import("sharp")).default;
    return sharp(source)
      // alphaQuality 拉满: 立绘的半透明边缘是压缩最容易露馅的地方, 省这几 KB 不划算。
      .webp({ quality, effort, alphaQuality: 100 })
      .toBuffer();
  }

  async function toMp4(filePath, outPath, relName) {
    console.log(`[img-optimize] 转码视频 ${relName} …`);
    await runFfmpeg([
      "-i",
      filePath,
      // 只在超宽时缩, 已经够小的视频不做无谓的重采样。-2 保证高度为偶数(H.264 要求)。
      "-vf",
      `scale='min(iw\\,${maxWidth})':-2`,
      "-c:v",
      "libx264",
      "-crf",
      String(crf),
      "-preset",
      preset,
      // 背景视频在两处 <video> 上都是 muted 播放的, 音轨是纯粹的死重量。
      "-an",
      // moov 前置: 不必等整个文件下完就能出首帧, 对 100MB 级的首屏预载很关键。
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      "-y",
      outPath,
    ]);
  }

  return {
    name: "img-optimize",
    // 必须早于 vite:asset —— 它会把资源 import 直接改写成 URL 字符串, 之后就没得拦了。
    enforce: "pre",
    apply: () => enabled,

    configResolved(config) {
      isBuild = config.command === "build";
    },

    async load(id) {
      if (BYPASS_QUERY.test(id)) return null;
      const filePath = id.split("?")[0];
      const isImage = IMAGE_TARGET.test(filePath);
      const isVideo = VIDEO_TARGET.test(filePath);
      if ((!isImage && !isVideo) || !existsSync(filePath)) return null;
      if (isVideo && ffmpegOk === false) return null;

      const source = await readFile(filePath);
      const ext = isImage ? ".webp" : ".mp4";
      const key = cacheKey(
        source,
        isImage ? `q${quality}e${effort}` : `crf${crf}${preset}w${maxWidth}`,
      );
      const cacheFile = path.join(CACHE_DIR, `${key}${ext}`);

      let out;
      if (existsSync(cacheFile)) {
        out = await readFile(cacheFile);
      } else if (isImage) {
        out = await toWebp(source);
        await mkdir(CACHE_DIR, { recursive: true });
        await writeFile(cacheFile, out);
      } else {
        try {
          out = await serial(async () => {
            await mkdir(CACHE_DIR, { recursive: true });
            await toMp4(filePath, cacheFile, path.basename(filePath));
            return readFile(cacheFile);
          });
          ffmpegOk = true;
        } catch (e) {
          // 没装 ffmpeg 只警告一次并放行原视频, 不阻断开发/构建。
          if (ffmpegOk === null) {
            ffmpegOk = false;
            console.warn(
              `[img-optimize] ffmpeg 不可用, 视频将保持原样。装上后重跑即可压缩。\n  ${e.message}`,
            );
          }
          return null;
        }
      }

      // 图标、序列帧这类小图 WebP 经常反而更大; 视频若源本就是低码率, 重编码也可能变大。
      // 返回 null 交回 Vite 原生处理, 比强行换格式再赔上体积干净。
      if (out.length >= source.length) {
        stats.skipped += 1;
        return null;
      }

      stats[isImage ? "img" : "video"] += 1;
      stats.before += source.length;
      stats.after += out.length;
      scheduleReport();

      if (isBuild) {
        const ref = this.emitFile({
          type: "asset",
          name: path.basename(filePath).replace(isImage ? IMAGE_TARGET : VIDEO_TARGET, ext),
          source: out,
        });
        return `export default import.meta.ROLLUP_FILE_URL_${ref}`;
      }

      served.set(`${key}${ext}`, out);
      return `export default ${JSON.stringify(`${DEV_PREFIX}${key}${ext}`)}`;
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(DEV_PREFIX)) return next();
        const name = path.basename(req.url);
        const buf = served.get(name);
        if (!buf) return next();

        const type = MIME[path.extname(name)] ?? "application/octet-stream";
        // 文件名就是内容哈希 ⇒ 内容一变 URL 必变, 可以放心长缓存,
        // 免得每次 HMR 都把几十 MB 素材重新推一遍。
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
      });
    },

    closeBundle: report,
  };
}
