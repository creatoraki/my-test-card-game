import { CORRIDOR_PLAYER_ART_SOURCES } from "./corridorPlayerArt";

let decodedFrames: Promise<readonly (HTMLImageElement | undefined)[]> | undefined;

/** 保留已解码图片供画布同步绘制；仅缓存 URL 无法保证换帧时图片已可显示。 */
export function loadCorridorPlayerFrames(): Promise<readonly (HTMLImageElement | undefined)[]> {
  if (decodedFrames) return decodedFrames;
  decodedFrames = (async () => {
    const frames = new Array<HTMLImageElement | undefined>(CORRIDOR_PLAYER_ART_SOURCES.length);
    let next = 0;
    const worker = async () => {
      while (next < frames.length) {
        const index = next++;
        const src = CORRIDOR_PLAYER_ART_SOURCES[index];
        if (!src) continue;
        const image = new Image();
        image.src = src;
        await image.decode();
        frames[index] = image;
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    return frames;
  })().catch((error: unknown) => {
    decodedFrames = undefined;
    throw error;
  });
  return decodedFrames;
}
