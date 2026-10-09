// 仅处理已有透明通道：识别完整物体、分离四宫格并对齐画布。
// 不按颜色抠图，透明背景由生图模型提供。
import sharp from "sharp";

const MINIMUM_ALPHA = 8;

function clearTransparentNoise(data) {
  // 模型输出偶有透明度为 1 的远处残留；只清理低于约 3% 的透明噪点。
  // 不根据颜色去底，白色材质及正常半透明边缘仍来自模型的原始透明通道。
  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] < MINIMUM_ALPHA) data.fill(0, offset, offset + 4);
  }
}

function componentsOf(data, width, height) {
  const count = width * height;
  const labels = new Int32Array(count);
  const queue = new Int32Array(count);
  const components = [];
  for (let start = 0; start < count; start += 1) {
    if (labels[start] || !data[start * 4 + 3]) continue;
    const id = components.length + 1;
    let head = 0;
    let tail = 1;
    let left = width, top = height, right = -1, bottom = -1;
    queue[0] = start;
    labels[start] = id;
    while (head < tail) {
      const pixel = queue[head++];
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const next = ny * width + nx;
          if (labels[next] || !data[next * 4 + 3]) continue;
          labels[next] = id;
          queue[tail++] = next;
        }
      }
    }
    components.push({ id, area: tail, left, top, right, bottom });
  }
  return { labels, components };
}

function center(box) {
  return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
}

function gapBetween(a, b) {
  return Math.hypot(
    Math.max(0, a.left - b.right, b.left - a.right),
    Math.max(0, a.top - b.bottom, b.top - a.bottom),
  );
}

function union(a, b) {
  a.left = Math.min(a.left, b.left);
  a.top = Math.min(a.top, b.top);
  a.right = Math.max(a.right, b.right);
  a.bottom = Math.max(a.bottom, b.bottom);
}

function rectangle(box) {
  return { left: box.left, top: box.top, width: box.right - box.left + 1, height: box.bottom - box.top + 1 };
}

export function alphaBounds(data, width, height) {
  const box = { left: width, top: height, right: -1, bottom: -1 };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3]) union(box, { left: x, right: x, top: y, bottom: y });
    }
  }
  if (box.right < 0) throw new Error("没有可见的素材像素。");
  return rectangle(box);
}

export async function separateFourProps(inputPath) {
  const metadata = await sharp(inputPath).metadata();
  if (!metadata.hasAlpha) throw new Error("输入必须是生图模型已抠好的透明图片，脚本不会自行去底。");
  const { data, info } = await sharp(inputPath).toColourspace("srgb").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  clearTransparentNoise(data);
  const { width, height } = info;
  const { labels, components } = componentsOf(data, width, height);
  const anchors = [...components].sort((a, b) => b.area - a.area).slice(0, 4);
  if (anchors.length !== 4 || anchors.some((box) => box.area < width * height * 0.002)) {
    throw new Error("未识别到四个独立完整的主体，请检查模型抠图是否包含真实透明背景及四件分离的物体。");
  }
  // 按主体中心分上下两行，再按左右排序，允许物体越过几何中线。
  anchors.sort((a, b) => center(a).y - center(b).y);
  const ordered = [
    ...anchors.slice(0, 2).sort((a, b) => center(a).x - center(b).x),
    ...anchors.slice(2).sort((a, b) => center(a).x - center(b).x),
  ];
  const boxes = ordered.map((box) => ({ ...box }));
  const groups = new Int8Array(components.length + 1).fill(-1);
  ordered.forEach((box, index) => { groups[box.id] = index; });
  for (const part of components) {
    if (groups[part.id] >= 0) continue;
    const nearest = ordered.map((box, index) => ({ index, distance: gapBetween(part, box) }))
      .sort((a, b) => a.distance - b.distance)[0];
    // 保留附近的独立装饰、光点；跳过远离主体的零碎噪点。
    const maximumGap = part.area < 8 ? 4 : Math.min(width, height) * 0.08;
    if (nearest.distance > maximumGap) continue;
    groups[part.id] = nearest.index;
    union(boxes[nearest.index], part);
  }
  const props = boxes.map((box) => {
    const bounds = rectangle(box);
    return { bounds, data: Buffer.alloc(bounds.width * bounds.height * 4) };
  });
  for (let pixel = 0; pixel < labels.length; pixel += 1) {
    if (!labels[pixel]) continue;
    const group = groups[labels[pixel]];
    if (group < 0) continue;
    const prop = props[group];
    const x = pixel % width - prop.bounds.left;
    const y = Math.floor(pixel / width) - prop.bounds.top;
    data.copy(prop.data, (y * prop.bounds.width + x) * 4, pixel * 4, pixel * 4 + 4);
  }
  return { width, height, props };
}

export async function alignProp(prop, size, bottomMargin) {
  const available = size - bottomMargin * 2;
  const raw = { width: prop.bounds.width, height: prop.bounds.height, channels: 4 };
  const resized = await sharp(prop.data, { raw })
    .resize(available, available, { fit: "inside", kernel: "lanczos3" })
    .raw().toBuffer({ resolveWithObject: true });
  clearTransparentNoise(resized.data);
  // 重算缩放后的实际边界，防止透明边或插值影响统一落地位置。
  const visible = alphaBounds(resized.data, resized.info.width, resized.info.height);
  const left = Math.floor((size - visible.width) / 2);
  const top = size - bottomMargin - visible.height;
  const image = await sharp(resized.data, {
    raw: { width: resized.info.width, height: resized.info.height, channels: 4 },
  }).extract(visible).extend({
    left, right: size - left - visible.width,
    top, bottom: bottomMargin,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).png().toBuffer();
  return { image, bounds: { left, top, width: visible.width, height: visible.height } };
}
