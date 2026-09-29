// 立体声总线 → 16 位 PCM WAV 字节。
import { SR } from "./dsp.mjs";

export function encodeWav(bus) {
  const frames = bus.L.length;
  const dataBytes = frames * 4;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16); // fmt 块长度
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // 声道数
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28); // 字节率
  buf.writeUInt16LE(4, 32); // 块对齐
  buf.writeUInt16LE(16, 34); // 位深
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataBytes, 40);
  const toInt = (s) => Math.max(-32768, Math.min(32767, Math.round(s * 32767)));
  for (let i = 0; i < frames; i++) {
    buf.writeInt16LE(toInt(bus.L[i]), 44 + i * 4);
    buf.writeInt16LE(toInt(bus.R[i]), 46 + i * 4);
  }
  return buf;
}
