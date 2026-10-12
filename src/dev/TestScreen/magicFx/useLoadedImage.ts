import { useEffect, useState } from "react";

/** 已解码完成的图片，按地址缓存：重播时直接复用，不再等加载。 */
const cache = new Map<string, HTMLImageElement>();

/** 加载一张图片作为着色器贴图；src 为 null 或尚未加载完成时返回 null。 */
export function useLoadedImage(src: string | null): HTMLImageElement | null {
  const [image, setImage] = useState(() => (src ? cache.get(src) ?? null : null));
  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const cached = cache.get(src);
    if (cached) {
      setImage(cached);
      return;
    }
    let alive = true;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      cache.set(src, img);
      if (alive) setImage(img);
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return image;
}
