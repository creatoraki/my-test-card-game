import { useEffect, useState } from "react";
import type { EnemySpriteDef } from "@/ui/art/battle/enemyArt";

// ============================================================================
// 余烬焚解的立绘贴图: 把立绘展示框(view)画进一张离屏 2D 画布, 交给共享 GLSL 宿主当 uTex。
//   · 先裁切再缩到长边 ≤ MAX_SIDE: 源图多为 2048 级, WebGL1 的非 2 幂贴图没有 mipmap,
//     直接大图缩小采样会闪烁; 预缩一次既清晰又省显存。
//   · 左右镜像在这里做掉, 着色器只管按展示框采样。
//   · 按 src + 镜像缓存, 整局每种敌人只画一次; 宿主再按画布对象只上传一次。
// ============================================================================

const MAX_SIDE = 768;
const EMOJI_SIDE = 256;

const ready = new Map<string, HTMLCanvasElement>();
const pending = new Map<string, Promise<HTMLCanvasElement | null>>();

function textureKey(sprite: EnemySpriteDef | undefined, flip: boolean, emoji: string): string {
  return sprite ? `${sprite.src}|${flip ? 1 : 0}` : `emoji|${emoji}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  return image.decode().then(() => image);
}

function spriteTexture(sprite: EnemySpriteDef, flip: boolean): Promise<HTMLCanvasElement | null> {
  return loadImage(sprite.src).then((image) => {
    // sheet/view 只按比例参与换算: 素材文件等比缩小后仍按源图坐标取景。
    const unit = image.naturalWidth / sprite.sheet.w;
    const view = sprite.view ?? { x: 0, y: 0, w: sprite.sheet.w / sprite.frames, h: sprite.sheet.h };
    const sw = view.w * unit;
    const sh = view.h * unit;
    const fit = Math.min(1, MAX_SIDE / Math.max(sw, sh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sw * fit));
    canvas.height = Math.max(1, Math.round(sh * fit));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (flip) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(image, view.x * unit, view.y * unit, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas;
  });
}

// 未登记立绘的敌人显示 emoji: 画成同尺寸贴图, 底边对齐(与展示框脚线一致)。
function emojiTexture(emoji: string): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = EMOJI_SIDE;
  canvas.height = EMOJI_SIDE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = `${Math.round(EMOJI_SIDE * 0.78)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(emoji, EMOJI_SIDE / 2, EMOJI_SIDE * 0.96);
  return canvas;
}

function requestTexture(key: string, sprite: EnemySpriteDef | undefined, flip: boolean, emoji: string): Promise<HTMLCanvasElement | null> {
  const existing = pending.get(key);
  if (existing) return existing;
  const job = (sprite ? spriteTexture(sprite, flip) : Promise.resolve(emojiTexture(emoji)))
    .catch(() => null)
    .then((canvas) => {
      if (canvas) ready.set(key, canvas);
      else pending.delete(key); // 失败允许下次挂载重试
      return canvas;
    });
  pending.set(key, job);
  return job;
}

/**
 * 单位挂载即预热本单位的死亡贴图(幂等)。返回 null = 还没画好 ——
 * 此时死亡演出退回 CSS 消散, 不会出现立绘被隐藏而着色器还是空白的断档。
 */
export function useDeathTexture(sprite: EnemySpriteDef | undefined, flip: boolean, emoji: string): HTMLCanvasElement | null {
  const key = textureKey(sprite, flip, emoji);
  const [texture, setTexture] = useState<{ key: string; canvas: HTMLCanvasElement | null }>(() => ({
    key,
    canvas: ready.get(key) ?? null,
  }));

  useEffect(() => {
    const cached = ready.get(key);
    if (cached) {
      setTexture({ key, canvas: cached });
      return;
    }
    let alive = true;
    void requestTexture(key, sprite, flip, emoji).then((canvas) => {
      if (alive) setTexture({ key, canvas });
    });
    return () => {
      alive = false;
    };
    // sprite/flip/emoji 已全部折进 key。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return texture.key === key ? texture.canvas : ready.get(key) ?? null;
}
