import { CORRIDOR_PLAYER_ART_SOURCES } from "./corridorPlayerArt";

let decodedFrames: Promise<readonly (ImageBitmap | undefined)[]> | undefined;

/** 缓存位图供画布同步绘制，避免浏览器在换帧时回收图片解码数据。 */
export function loadCorridorPlayerFrames(): Promise<readonly (ImageBitmap | undefined)[]> {
  if (decodedFrames) return decodedFrames;
  decodedFrames = (async () => {
    const frames = new Array<ImageBitmap | undefined>(CORRIDOR_PLAYER_ART_SOURCES.length);
    let next = 0;
    const worker = async () => {
      while (next < frames.length) {
        const index = next++;
        const src = CORRIDOR_PLAYER_ART_SOURCES[index];
        if (!src) continue;
        const image = new Image();
        image.src = src;
        await image.decode();
        frames[index] = await createImageBitmap(image);
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
