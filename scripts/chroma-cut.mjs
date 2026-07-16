// 纯色背景立绘抠图 —— 把纯色底(常见于 AI 生成的立绘)抠成透明 PNG 并裁到角色边界。
// 项目约定素材本身即透明 PNG(见 ui/enemyArt.ts), 故抠图是离线一次性产物, 运行时不参与。
// 零依赖: PNG 解码/编码全靠 Node 内置 zlib。
//
// 用法: node scripts/chroma-cut.mjs <in.png> <out.png> [--threshold 60]
//
// 抠的是"与画布边缘连通"的背景, 而不是"全图里颜色接近背景色的像素" —— 角色身上可能有与
// 背景同色系的部件(如废品机器人胸口的粉紫霓虹图标), 全图阈值会把它一起抠掉。
import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

// ---- PNG 解码 ----

function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error("不是 PNG 文件");
  let p = 8;
  let ihdr = null;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("ascii", p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") {
      ihdr = {
        w: data.readUInt32BE(0),
        h: data.readUInt32BE(4),
        depth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if (!ihdr) throw new Error("缺少 IHDR");
  if (ihdr.depth !== 8) throw new Error(`只支持 8-bit, 实际 ${ihdr.depth}-bit`);
  if (ihdr.interlace !== 0) throw new Error("不支持隔行(Adam7) PNG");
  const ch = CHANNELS[ihdr.colorType];
  if (!ch || ihdr.colorType === 3) throw new Error(`不支持 colorType ${ihdr.colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  return { ...ihdr, ch, pixels: unfilter(raw, ihdr.w, ihdr.h, ch) };
}

// 反 PNG 行滤波(每行首字节是 filter type)。上/左邻取自"已还原"的输出, 故必须逐行推进。
function unfilter(raw, w, h, ch) {
  const stride = w * ch;
  const out = Buffer.alloc(h * stride);
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[pos++];
    const row = y * stride;
    for (let x = 0; x < stride; x++) {
      const v = raw[pos + x];
      const a = x >= ch ? out[row + x - ch] : 0; // 左
      const b = y > 0 ? out[row - stride + x] : 0; // 上
      const c = x >= ch && y > 0 ? out[row - stride + x - ch] : 0; // 左上
      let r;
      switch (ft) {
        case 0: r = v; break;
        case 1: r = v + a; break;
        case 2: r = v + b; break;
        case 3: r = v + ((a + b) >> 1); break;
        case 4: {
          const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
          r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error(`未知 filter type ${ft} (行 ${y})`);
      }
      out[row + x] = r & 255;
    }
    pos += stride;
  }
  return out;
}

// ---- PNG 编码(RGBA) ----

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodeRgba(rgba, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  // 每行加 filter type 0(None) —— 产物是一次性素材, 不为压缩率做逐行滤波选择
  const stride = w * 4;
  const body = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    body[y * (stride + 1)] = 0;
    rgba.copy(body, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(body, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- 抠图 ----

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let hue = 0;
  if (d) {
    if (mx === r) hue = 60 * (((g - b) / d) % 6);
    else if (mx === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
  }
  if (hue < 0) hue += 360;
  return [hue, mx ? d / mx : 0, mx];
}

function chromaCut(img, opts) {
  const { w, h, ch, pixels } = img;
  const { threshold, hueTol, minSat, minHole } = opts;
  const rgb = (x, y) => {
    const o = (y * w + x) * ch;
    return [pixels[o], pixels[o + 1], pixels[o + 2]];
  };

  // 背景基准色 = 四角均值(纯色底的四角必是背景)
  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  const ref = [0, 1, 2].map(
    (i) => corners.reduce((s, [x, y]) => s + rgb(x, y)[i], 0) / corners.length,
  );
  const refHue = rgbToHsv(...ref)[0];
  const dist = (x, y) => {
    const c = rgb(x, y);
    return Math.abs(c[0] - ref[0]) + Math.abs(c[1] - ref[1]) + Math.abs(c[2] - ref[2]);
  };

  // 背景判据走 色相+饱和度, 而不是到背景色的 RGB 距离: 角色投在背景上的阴影色相仍是背景色相,
  // 但明度掉一半 —— RGB 距离会把它当成前景留下一片紫块。反过来, 角色身上被紫光染到的金属
  // 反光虽然 RGB 距离近, 但饱和度很低(实测中位 0.11 vs 背景 0.67), 靠 minSat 就能摘干净。
  // 近黑像素(v < 0.1)的色相是数值噪声, 一律不判背景。
  const isBg = (x, y) => {
    const [hue, s, v] = rgbToHsv(...rgb(x, y));
    if (v < 0.1 || s < minSat) return false;
    const dh = Math.abs(hue - refHue);
    return Math.min(dh, 360 - dh) <= hueTol;
  };

  const hard = threshold * 3; // 曼哈顿距离阈值(三通道之和), 只用于软边羽化
  const bgMask = new Uint8Array(w * h);

  // 1) 从四边 flood fill, 只标记与画布边缘连通的背景。
  //    不能对全图直接用颜色判据: 角色身上难免有零星同色系像素, 只有连通性能把它们和真背景分开。
  const stack = [];
  const push = (x, y) => {
    if (!bgMask[y * w + x] && isBg(x, y)) {
      bgMask[y * w + x] = 1;
      stack.push(x, y);
    }
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }

  // 2) 补背景孔洞: 被角色围住(如手臂与身体之间)的背景与画布边缘不连通, 上一步够不着。
  //    这里同样只认背景色相, 再加一道面积闸(minHole) —— 角色上的同色系细节是零散小块。
  let holes = 0;
  const visited = new Uint8Array(w * h);
  for (let y0 = 0; y0 < h; y0++) {
    for (let x0 = 0; x0 < w; x0++) {
      const i0 = y0 * w + x0;
      if (bgMask[i0] || visited[i0] || !isBg(x0, y0)) continue;
      const cells = [];
      const q = [x0, y0];
      visited[i0] = 1;
      while (q.length) {
        const y = q.pop(), x = q.pop();
        cells.push(y * w + x);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = ny * w + nx;
          if (bgMask[ni] || visited[ni] || !isBg(nx, ny)) continue;
          visited[ni] = 1;
          q.push(nx, ny);
        }
      }
      if (cells.length < minHole) continue;
      for (const i of cells) bgMask[i] = 1;
      holes += cells.length;
    }
  }

  // 3) 背景 mask 向角色内收 1px, 吃掉抗锯齿留下的背景色描边
  const edge = []; // 收进来的这一圈就是软边带: 只在这里做 alpha 羽化与去色污染
  const grown = Uint8Array.from(bgMask);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (bgMask[i]) continue;
      const near =
        (x > 0 && bgMask[i - 1]) ||
        (x < w - 1 && bgMask[i + 1]) ||
        (y > 0 && bgMask[i - w]) ||
        (y < h - 1 && bgMask[i + w]);
      if (near) { grown[i] = 1; edge.push(i); }
    }
  }
  // 软边带 = 紧挨 grown 的下一圈保留像素
  const band = new Uint8Array(w * h);
  for (const i of edge) {
    for (const ni of [i - 1, i + 1, i - w, i + w]) {
      if (ni >= 0 && ni < w * h && !grown[ni]) band[ni] = 1;
    }
  }

  // 4) 生成 RGBA。角色内部一律原样不透明 —— 早期版本对全图按颜色距离羽化, 结果把桶身的紫色
  //    反光也半透明化并去污染成了青绿(紫的补色), 故羽化严格限制在 band 内。
  const rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const o = i * 4;
      if (grown[i]) continue; // alpha 已是 0
      const [r, g, b] = rgb(x, y);
      const d = dist(x, y);
      let a = 255;
      if (band[i] && d < hard) a = Math.round((d / hard) * 255);
      if (a === 0) continue;
      if (a < 255) {
        // 去污染: 观测色 = 前景按 α 混合背景, 反解前景色, 否则半透明边缘残留背景色调
        const f = a / 255;
        const src = [r, g, b];
        for (let k = 0; k < 3; k++) {
          rgba[o + k] = Math.max(0, Math.min(255, Math.round((src[k] - ref[k] * (1 - f)) / f)));
        }
      } else {
        rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = b;
      }
      rgba[o + 3] = a;
    }
  }

  return { rgba, ref, holes };
}

// 裁到非透明像素的包围盒
function cropToContent(rgba, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) throw new Error("抠图后没有剩下任何像素 —— threshold 太大?");
  const cw = x1 - x0 + 1, cwh = y1 - y0 + 1;
  const out = Buffer.alloc(cw * cwh * 4);
  for (let y = 0; y < cwh; y++) {
    rgba.copy(out, y * cw * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + cw) * 4);
  }
  return { rgba: out, w: cw, h: cwh, box: [x0, y0, x1, y1] };
}

// ---- CLI ----

const USAGE = `用法: node scripts/chroma-cut.mjs <in.png> <out.png> [选项]

  --hue-tol N     背景色相容差(度, 默认 14)。背景与角色靠色相分家, 这是主判据。
  --min-sat N     背景最低饱和度(0-1, 默认 0.5)。角色身上被背景光染到的反光饱和度低,
                  靠这道闸摘掉; 调低会开始啃角色。
  --min-hole N    背景孔洞连通块的最小面积(默认 300)。小于此的同色系碎片视作角色细节保留。
  --threshold N   软边羽化的颜色容差(默认 60)。只影响边缘 1px 的 alpha 过渡与去色污染。`;

const args = process.argv.slice(2);
const skip = new Set();
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  if (i < 0) return dflt;
  skip.add(i).add(i + 1);
  return Number(args[i + 1]);
};
const threshold = flag("--threshold", 60);
const hueTol = flag("--hue-tol", 14);
const minSat = flag("--min-sat", 0.5);
const minHole = flag("--min-hole", 300);
const [input, output] = args.filter((_, i) => !skip.has(i));

if (!input || !output || ![threshold, hueTol, minSat, minHole].every(Number.isFinite)) {
  console.error(USAGE);
  process.exit(1);
}

const img = decodePng(readFileSync(input));
const { rgba, ref, holes } = chromaCut(img, { threshold, hueTol, minSat, minHole });
const cropped = cropToContent(rgba, img.w, img.h);
writeFileSync(output, encodeRgba(cropped.rgba, cropped.w, cropped.h));

console.log(`源图    ${img.w}×${img.h} colorType=${img.colorType}`);
console.log(`背景色  rgb(${ref.map((v) => Math.round(v)).join(", ")})  hue=${rgbToHsv(...ref)[0].toFixed(0)}°`);
console.log(`参数    hue-tol=${hueTol} min-sat=${minSat} min-hole=${minHole} threshold=${threshold}`);
console.log(`孔洞    补掉 ${holes} px`);
console.log(`裁剪框  [${cropped.box.join(", ")}]`);
console.log(`产物    ${output}  ${cropped.w}×${cropped.h}`);
