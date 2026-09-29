/**
 * 颗粒脏污贴图：运行时用 Canvas 生成一次，全部物件共用同一张 dataURL。
 * 多尺度的暗斑 + 细颗粒 + 少量亮点划痕，叠在面板上模拟素材里的旧化质感。
 */
const SIZE = 192;
let cached: string | null = null;

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

export function grimeTexture(): string {
  if (cached !== null) return cached;
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const random = seeded(97);

  // 大块暗斑：跨边的斑块在对侧补画，保证平铺无接缝
  for (let i = 0; i < 26; i += 1) {
    const x0 = random() * SIZE;
    const y0 = random() * SIZE;
    const r = 10 + random() * 26;
    const alpha = 0.18 + random() * 0.2;
    for (const dx of [-SIZE, 0, SIZE]) {
      for (const dy of [-SIZE, 0, SIZE]) {
        const x = x0 + dx;
        const y = y0 + dy;
        if (x + r < 0 || x - r > SIZE || y + r < 0 || y - r > SIZE) continue;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, `rgba(20, 14, 8, ${alpha})`);
        gradient.addColorStop(1, "rgba(20, 14, 8, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
  }
  // 细颗粒
  for (let i = 0; i < 1800; i += 1) {
    const dark = random() > 0.25;
    ctx.fillStyle = dark ? `rgba(8, 10, 12, ${0.15 + random() * 0.35})` : `rgba(210, 225, 230, ${0.08 + random() * 0.14})`;
    const size = random() > 0.9 ? 2 : 1;
    ctx.fillRect(Math.floor(random() * SIZE), Math.floor(random() * SIZE), size, size);
  }
  // 细划痕
  ctx.lineCap = "round";
  for (let i = 0; i < 16; i += 1) {
    const x = random() * SIZE;
    const y = random() * SIZE;
    const angle = random() * Math.PI;
    const length = 5 + random() * 14;
    ctx.strokeStyle = `rgba(200, 215, 220, ${0.12 + random() * 0.14})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }
  cached = canvas.toDataURL("image/png");
  return cached;
}

export const GRIME_TEXTURE_SIZE = SIZE;
