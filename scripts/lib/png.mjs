import zlib from "node:zlib";

export const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
export const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

// PNG 解码

export function decodePng(buf) {
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
export function unfilter(raw, w, h, ch) {
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

// PNG 编码(RGBA)

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

export function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

export function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export function encodeRgba(rgba, w, h) {
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
