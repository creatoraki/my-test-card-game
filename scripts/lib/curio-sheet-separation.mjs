// 用实心主体作种子分离道具，避免半透明边缘把相邻物件连成一组。
import sharp from "sharp";
import { componentsOf } from "./transparent-prop-layout.mjs";

const EDGE_ALPHA = 8;
const CORE_ALPHA = 64;
const POSITIONS = ["左上", "右上", "左下", "右下"];

function center(part) {
  return { x: (part.left + part.right) / 2, y: (part.top + part.bottom) / 2 };
}

function orderCores(components, width, height) {
  const sorted = [...components].sort((a, b) => b.area - a.area);
  const minimumArea = width * height * 0.002;
  if (sorted.length < 4 || sorted[3].area < minimumArea) {
    throw new Error("无法识别四个独立主体，请检查透明原图。");
  }
  if (sorted[4]?.area >= minimumArea) {
    throw new Error("原图存在超过四个较大的独立区域，无法安全自动归类。");
  }
  const cores = sorted.slice(0, 4).sort((a, b) => center(a).y - center(b).y);
  const ordered = [
    ...cores.slice(0, 2).sort((a, b) => center(a).x - center(b).x),
    ...cores.slice(2).sort((a, b) => center(a).x - center(b).x),
  ];
  const rowGap = Math.min(ordered[2].top, ordered[3].top)
    - Math.max(ordered[0].bottom, ordered[1].bottom);
  if (rowGap <= 0) throw new Error("上下两行主体有交叠，停止切图以避免误切。");
  return ordered;
}

function assignEdges(data, labels, cores, width, height) {
  const owners = new Uint8Array(width * height);
  const queue = new Int32Array(owners.length);
  const coreOwners = new Map(cores.map((core, index) => [core.id, index + 1]));
  let head = 0, tail = 0;
  // 四个主体内部的所有像素都作种子，低透明度桥接像素归到最近主体。
  for (let pixel = 0; pixel < owners.length; pixel += 1) {
    const owner = coreOwners.get(labels[pixel]);
    if (!owner) continue;
    owners[pixel] = owner;
    queue[tail++] = pixel;
  }
  while (head < tail) {
    const pixel = queue[head++];
    const x = pixel % width, y = Math.floor(pixel / width);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const next = ny * width + nx;
        if (owners[next] || data[next * 4 + 3] < EDGE_ALPHA) continue;
        // 其他实心连通区域不当作边缘合并，防止将独立噪点误认为陪衬。
        if (data[next * 4 + 3] >= CORE_ALPHA && !coreOwners.has(labels[next])) continue;
        owners[next] = owners[pixel];
        queue[tail++] = next;
      }
    }
  }
  return owners;
}

function isolate(data, owners, width, height, padding) {
  const boxes = Array.from({ length: 4 }, () => ({
    left: width, top: height, right: -1, bottom: -1, pixels: 0,
  }));
  let ignoredPixels = 0;
  for (let pixel = 0; pixel < owners.length; pixel += 1) {
    const owner = owners[pixel];
    if (!owner) {
      if (data[pixel * 4 + 3]) ignoredPixels += 1;
      continue;
    }
    const box = boxes[owner - 1];
    const x = pixel % width, y = Math.floor(pixel / width);
    box.left = Math.min(box.left, x);
    box.right = Math.max(box.right, x);
    box.top = Math.min(box.top, y);
    box.bottom = Math.max(box.bottom, y);
    box.pixels += 1;
  }
  const props = boxes.map((box, index) => {
    if (!box.pixels) throw new Error(`${POSITIONS[index]}没有有效像素。`);
    const sourceBounds = {
      left: box.left, top: box.top,
      width: box.right - box.left + 1, height: box.bottom - box.top + 1,
    };
    const outputWidth = sourceBounds.width + padding * 2;
    const outputHeight = sourceBounds.height + padding * 2;
    return {
      position: POSITIONS[index], sourceBounds, pixels: box.pixels,
      width: outputWidth, height: outputHeight,
      data: Buffer.alloc(outputWidth * outputHeight * 4),
    };
  });
  // 逐像素按归属复制；即使包围框相交，也不会带入其他组的像素。
  for (let pixel = 0; pixel < owners.length; pixel += 1) {
    if (!owners[pixel]) continue;
    const prop = props[owners[pixel] - 1];
    const x = pixel % width - prop.sourceBounds.left + padding;
    const y = Math.floor(pixel / width) - prop.sourceBounds.top + padding;
    const destination = (y * prop.width + x) * 4;
    data.copy(prop.data, destination, pixel * 4, pixel * 4 + 4);
  }
  return { props, ignoredPixels };
}

export async function separateCurioSheet(inputPath, padding = 8) {
  const metadata = await sharp(inputPath).metadata();
  if (!metadata.hasAlpha) throw new Error("输入图片必须含有真实透明通道。");
  const { data, info } = await sharp(inputPath)
    .toColourspace("srgb").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const { labels, components } = componentsOf(data, width, height, CORE_ALPHA);
  const cores = orderCores(components, width, height);
  const owners = assignEdges(data, labels, cores, width, height);
  return {
    width, height, edgeAlpha: EDGE_ALPHA, coreAlpha: CORE_ALPHA,
    ...isolate(data, owners, width, height, padding),
  };
}
