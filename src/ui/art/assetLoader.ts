const imagePromises = new Map<string, Promise<void>>();
const videoPromises = new Map<string, Promise<void>>();
const heldImages = new Map<string, HTMLImageElement>();
const heldVideos = new Map<string, HTMLVideoElement>();

export const VIDEO_PRELOAD_TIMEOUT_MS = 15_000;

export function preloadImage(src: string): Promise<void> {
  const existing = imagePromises.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const image = new Image();
    let settled = false;

    heldImages.set(src, image);

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const fail = () => {
      if (settled) return;
      settled = true;
      reject(new Error(`图片加载失败: ${src}`));
    };

    const finishAfterDecode = () => {
      if (typeof image.decode !== "function") {
        finish();
        return;
      }
      void image.decode().then(finish, fail);
    };

    image.decoding = "async";
    image.onload = finishAfterDecode;
    image.onerror = fail;
    image.src = src;

    if (image.complete) {
      if (image.naturalWidth > 0) finishAfterDecode();
      else fail();
    }
  });

  imagePromises.set(src, promise);
  return promise;
}

export function preloadVideo(src: string, timeoutMs = VIDEO_PRELOAD_TIMEOUT_MS): Promise<void> {
  const existing = videoPromises.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      resolve();
      return;
    }

    const video = document.createElement("video");
    let settled = false;
    let timer: number | undefined;

    heldVideos.set(src, video);

    const cleanup = () => {
      video.removeEventListener("loadeddata", finish);
      video.removeEventListener("error", fail);
      if (timer !== undefined) window.clearTimeout(timer);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`视频加载失败: ${src}`));
    };

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadeddata", finish);
    video.addEventListener("error", fail);
    video.src = src;
    video.load();
    timer = window.setTimeout(fail, timeoutMs);

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) finish();
  });

  videoPromises.set(src, promise);
  return promise;
}