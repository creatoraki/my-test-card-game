const imagePromises = new Map<string, Promise<void>>();
const videoPromises = new Map<string, Promise<void>>();
const pendingImageLoads: Array<() => void> = [];
const IMAGE_PRELOAD_CONCURRENCY = 2;
const IDLE_PRELOAD_TIMEOUT_MS = 250;
const FALLBACK_PRELOAD_DELAY_MS = 32;

let activeImageLoads = 0;
let imagePumpScheduled = false;

export const VIDEO_PRELOAD_TIMEOUT_MS = 15_000;

export function scheduleLowPriority(callback: () => void): void {
  if (typeof window === "undefined") {
    callback();
    return;
  }

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout: IDLE_PRELOAD_TIMEOUT_MS });
    return;
  }

  window.setTimeout(callback, FALLBACK_PRELOAD_DELAY_MS);
}

function pumpImageLoads(): void {
  imagePumpScheduled = false;

  while (activeImageLoads < IMAGE_PRELOAD_CONCURRENCY && pendingImageLoads.length > 0) {
    const startLoad = pendingImageLoads.shift();
    if (!startLoad) return;
    activeImageLoads += 1;
    startLoad();
  }
}

function scheduleImagePump(): void {
  if (imagePumpScheduled) return;
  imagePumpScheduled = true;
  scheduleLowPriority(pumpImageLoads);
}

export function preloadImage(src: string): Promise<void> {
  const existing = imagePromises.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    pendingImageLoads.push(() => {
      const image = new Image();
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        activeImageLoads -= 1;
        resolve();
        scheduleImagePump();
      };

      const fail = () => {
        if (settled) return;
        settled = true;
        activeImageLoads -= 1;
        reject(new Error(`图片加载失败: ${src}`));
        scheduleImagePump();
      };

      const finishAfterDecode = () => {
        if (typeof image.decode !== "function") {
          finish();
          return;
        }
        void image.decode().then(finish, fail);
      };

      image.decoding = "async";
      image.fetchPriority = "low";
      image.onload = finishAfterDecode;
      image.onerror = fail;
      image.src = src;

      if (image.complete) {
        if (image.naturalWidth > 0) finishAfterDecode();
        else fail();
      }
    });
  });

  imagePromises.set(src, promise);
  scheduleImagePump();
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