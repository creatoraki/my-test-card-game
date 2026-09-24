import * as THREE from "three";
import { mulberry32 } from "./canvasNoise";

// 小尺寸的画布贴图: 标牌文字、渐变遮罩、售货机面板、纸张。按 key 缓存, 演示卸载时统一销毁。

const cache = new Map<string, THREE.CanvasTexture>();

function cached(key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void, srgb = true): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
}

export function disposeDecals(): void {
  for (const texture of cache.values()) texture.dispose();
  cache.clear();
}

const FONT = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';

/** 发光标牌: 深色底 + 亮色中文, 用作自发光贴图。 */
export function signTexture(text: string, color: string, background = "#06140c"): THREE.CanvasTexture {
  return cached(`sign:${text}:${color}:${background}`, 256, 96, (ctx) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 244, 84);
    ctx.fillStyle = color;
    ctx.font = `bold 48px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 50);
  });
}

/** 径向渐变 alpha: 中心 1 → 边缘 0。 */
export function radialTexture(): THREE.CanvasTexture {
  return cached("radial", 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }, false);
}

/** 纵向渐变 alpha: 底部 1 → 顶部 0(门口微光、地面光带)。 */
export function fadeTexture(): THREE.CanvasTexture {
  return cached("fade", 16, 128, (ctx) => {
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 128);
  }, false);
}

/** 积水: 不规则水洼形状的 alpha。 */
export function puddleTexture(seed: number): THREE.CanvasTexture {
  return cached(`puddle:${seed}`, 256, 256, (ctx) => {
    const rng = mulberry32(seed);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 256, 256);
    ctx.filter = "blur(10px)";
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.ellipse(128 + (rng() - 0.5) * 120, 128 + (rng() - 0.5) * 120, 30 + rng() * 45, 20 + rng() * 35, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = "none";
  }, false);
}

/** 售货机灯箱: 冷色渐变 + 商品栏格, 用作自发光贴图。 */
export function vendingTexture(): THREE.CanvasTexture {
  return cached("vending", 256, 512, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#d9f6ff");
    g.addColorStop(1, "#7fcfe6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 512);
    const rng = mulberry32(5);
    const colors = ["#e0463a", "#f2b233", "#3aa4e0", "#58c46a", "#f06aa8", "#ffffff", "#8e5cf0"];
    for (let row = 0; row < 5; row += 1) {
      const y = 30 + row * 92;
      ctx.fillStyle = "rgba(20,40,50,0.55)";
      ctx.fillRect(12, y + 64, 232, 6);
      for (let col = 0; col < 5; col += 1) {
        if (rng() < 0.28) continue; // 被搬空的格子
        ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
        const x = 20 + col * 45;
        ctx.fillRect(x, y + 14, 30, 50);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(x + 4, y + 18, 5, 40);
      }
    }
  });
}

/** 散落的文件纸张: 白纸 + 模糊字行。 */
export function paperTexture(): THREE.CanvasTexture {
  return cached("paper", 64, 84, (ctx) => {
    ctx.fillStyle = "#d8d4c6";
    ctx.fillRect(0, 0, 64, 84);
    ctx.fillStyle = "rgba(40,40,40,0.35)";
    for (let y = 12; y < 76; y += 6) ctx.fillRect(8, y, 20 + ((y * 7) % 28), 2);
    ctx.fillStyle = "rgba(90,70,40,0.18)";
    ctx.beginPath(); ctx.arc(46, 60, 14, 0, Math.PI * 2); ctx.fill();
  });
}

/** 黄黑斜纹警戒带。 */
export function stripeTexture(): THREE.CanvasTexture {
  const texture = cached("stripe", 128, 32, (ctx) => {
    ctx.fillStyle = "#d8b21e";
    ctx.fillRect(0, 0, 128, 32);
    ctx.fillStyle = "#151515";
    for (let x = -32; x < 160; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 32); ctx.lineTo(x + 16, 32); ctx.lineTo(x + 32, 0); ctx.lineTo(x + 16, 0);
      ctx.fill();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** 墙上的白板残留: 褪色的表格与潦草字迹。 */
export function boardTexture(): THREE.CanvasTexture {
  return cached("board", 256, 160, (ctx) => {
    ctx.fillStyle = "#c9ccc6";
    ctx.fillRect(0, 0, 256, 160);
    ctx.strokeStyle = "rgba(40,60,90,0.45)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.moveTo(20, 30 + i * 28); ctx.lineTo(236, 30 + i * 28); ctx.stroke(); }
    ctx.strokeStyle = "rgba(150,30,30,0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(40, 120); ctx.bezierCurveTo(80, 80, 140, 150, 210, 60); ctx.stroke();
    ctx.fillStyle = "rgba(150,30,30,0.7)";
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText("别出声", 150, 140);
  });
}
