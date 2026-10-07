import sharp from "sharp";

// 统计贯穿画布的蓝灰色边框，定位格框外沿，排除格间留白。
function borderProjections(data, width, height) {
  const xScores = new Float64Array(width);
  const yScores = new Float64Array(height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const [r, g, b, a] = data.subarray(offset, offset + 4);
      if (a > 128 && r >= 25 && r <= 65 && g >= 30 && g <= 80
        && b >= 40 && b <= 105 && b - r >= 5 && b - r <= 40
        && Math.abs(g - r) <= 25) {
        xScores[x] += 1;
        yScores[y] += 1;
      }
    }
  }
  return { xScores, yScores };
}

function axisBounds(scores, count) {
  const step = scores.length / count;
  const strongest = (from, to, expected) => {
    let best = Math.round(expected);
    for (let index = Math.max(0, Math.floor(from)); index <= Math.min(scores.length - 1, Math.ceil(to)); index += 1) {
      if (scores[index] > scores[best]) best = index;
    }
    return best;
  };
  return Array.from({ length: count }, (_, index) => {
    const start = index * step;
    const end = (index + 1) * step;
    const left = strongest(start, start + step * 0.12, start + step * 0.04);
    const right = strongest(end - step * 0.12, end - 1, end - step * 0.02);
    // 给边框留出两个原图像素，保留完整描边与抗锯齿。
    return { start: Math.max(Math.floor(start), left - 2), end: Math.min(Math.floor(end), right + 3) };
  });
}

export async function locateBuffGrid(input, { rows, columns, inset }) {
  const { data, info } = await sharp(input).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  if (width < columns * 16 || height < rows * 16) throw new Error("原图尺寸不足以按指定网格切分。");
  let horizontal;
  let vertical;
  if (inset == null) {
    const { xScores, yScores } = borderProjections(data, width, height);
    horizontal = axisBounds(xScores, columns);
    vertical = axisBounds(yScores, rows);
  } else {
    const bounds = (length, count) => Array.from({ length: count }, (_, index) => ({
      start: Math.round(index * length / count) + inset,
      end: Math.round((index + 1) * length / count) - inset,
    }));
    horizontal = bounds(width, columns);
    vertical = bounds(height, rows);
  }
  const crops = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = horizontal[column];
      const y = vertical[row];
      if (x.end <= x.start || y.end <= y.start) throw new Error("裁切范围无效，请减小内缩像素。");
      crops.push({ row: row + 1, column: column + 1,
        left: x.start, top: y.start, width: x.end - x.start, height: y.end - y.start });
    }
  }
  return { data, width, height, crops };
}
