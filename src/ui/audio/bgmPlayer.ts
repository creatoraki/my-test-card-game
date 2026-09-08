import { createBoolPref, createVolumePref } from "./audioPref";
import { BGM_TRACKS, type BgmId } from "./bgmTracks";

const FADE_MS = 600;
const clampVolume = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

// 开关与音量各自持久化(键名沿用旧值, 存量档案不受影响)。
const enabledPref = createBoolPref("neon-city-bgm-enabled", true);
const volumePref = createVolumePref("neon-city-bgm-volume", 1);

const audioById: Record<BgmId, HTMLAudioElement> = {
  town: createAudio("town"),
  explore: createAudio("explore"),
  battle: createAudio("battle"),
  elevator: createAudio("elevator"),
};

const fadeFrames: Partial<Record<BgmId, number>> = {};
const rewindPending = new Set<BgmId>();

let currentBgm: BgmId | null = null;
let requestedBgm: BgmId | null = null;
let bgmSuspended = false;
let unlockHandler: (() => void) | null = null;

// ★ 每轨的实际播放音量 = 该轨的基准音量 × 全局音乐音量。
//   基准音量是逐轨调好的相对关系(见 bgmTracks.ts), 全局音量只做整体缩放, 两者不要混。
function trackVolume(id: BgmId): number {
  return clampVolume(BGM_TRACKS[id].volume * volumePref.get());
}

function createAudio(id: BgmId): HTMLAudioElement {
  const audio = new Audio(BGM_TRACKS[id].src);
  audio.loop = BGM_TRACKS[id].loop ?? true;
  audio.preload = "auto";
  audio.volume = 0;
  return audio;
}

function cancelFade(id: BgmId): void {
  const frame = fadeFrames[id];
  if (frame === undefined) return;
  cancelAnimationFrame(frame);
  delete fadeFrames[id];
}

function fadeTo(id: BgmId, targetVolume: number, onComplete?: () => void): void {
  const audio = audioById[id];
  cancelFade(id);

  const startVolume = audio.volume;
  if (startVolume === targetVolume) {
    onComplete?.();
    return;
  }

  let startedAt: number | null = null;
  const tick = (now: number) => {
    startedAt ??= now;
    const progress = Math.min(1, Math.max(0, (now - startedAt) / FADE_MS));
    audio.volume = clampVolume(
      startVolume + (targetVolume - startVolume) * progress,
    );
    if (progress >= 1) {
      audio.volume = clampVolume(targetVolume);
      delete fadeFrames[id];
      onComplete?.();
      return;
    }
    fadeFrames[id] = requestAnimationFrame(tick);
  };

  fadeFrames[id] = requestAnimationFrame(tick);
}

function removeUnlockListeners(): void {
  if (!unlockHandler || typeof window === "undefined") return;
  window.removeEventListener("pointerdown", unlockHandler);
  window.removeEventListener("keydown", unlockHandler);
  unlockHandler = null;
}

function queueUnlockRetry(): void {
  if (unlockHandler || typeof window === "undefined") return;

  const handleUnlock = () => {
    removeUnlockListeners();
    const id = requestedBgm;
    if (!id) return;
    requestPlayback(id);
  };

  unlockHandler = handleUnlock;
  window.addEventListener("pointerdown", handleUnlock, { once: true });
  window.addEventListener("keydown", handleUnlock, { once: true });
}

function requestPlayback(id: BgmId): void {
  const audio = audioById[id];
  try {
    const playback = audio.play();
    playback
      .then(() => {
        if (requestedBgm === id) removeUnlockListeners();
      })
      .catch(() => {
        if (requestedBgm === id) queueUnlockRetry();
      });
  } catch {
    if (requestedBgm === id) queueUnlockRetry();
  }
}

function resumeBgm(id: BgmId): void {
  const audio = audioById[id];
  cancelFade(id);
  if (rewindPending.has(id)) {
    audio.pause();
    audio.currentTime = 0;
    rewindPending.delete(id);
  }
  audio.volume = 0;
  requestPlayback(id);
  fadeTo(id, trackVolume(id));
}

export function playBgm(id: BgmId): void {
  requestedBgm = id;
  if (bgmSuspended) return;
  if (!enabledPref.get()) {
    if (currentBgm !== id) {
      currentBgm = id;
      if (id === "battle" || id === "elevator") audioById[id].currentTime = 0;
    }
    return;
  }
  if (currentBgm === id) return;

  const previousBgm = currentBgm;
  currentBgm = id;

  if (rewindPending.has(id)) {
    cancelFade(id);
    audioById[id].pause();
    audioById[id].currentTime = 0;
    rewindPending.delete(id);
  }

  if (previousBgm) {
    fadeTo(previousBgm, 0, () => {
      audioById[previousBgm].pause();
    });
  }

  const nextAudio = audioById[id];
  if (id === "battle" || id === "elevator") nextAudio.currentTime = 0;
  nextAudio.volume = 0;
  requestPlayback(id);
  fadeTo(id, trackVolume(id));
}

export function getBgmEnabled(): boolean {
  return enabledPref.get();
}

export function subscribeBgmEnabled(listener: () => void): () => void {
  return enabledPref.subscribe(listener);
}

export function setBgmEnabled(enabled: boolean): void {
  if (!enabledPref.set(enabled)) return;

  if (!enabled) {
    removeUnlockListeners();
    for (const id of Object.keys(audioById) as BgmId[]) {
      cancelFade(id);
      audioById[id].pause();
      audioById[id].volume = 0;
    }
  } else if (requestedBgm && !bgmSuspended) {
    resumeBgm(requestedBgm);
  }
}

export function toggleBgm(): void {
  setBgmEnabled(!enabledPref.get());
}

export function getBgmVolume(): number {
  return volumePref.get();
}

export function subscribeBgmVolume(listener: () => void): () => void {
  return volumePref.subscribe(listener);
}

// 拖滑块要**立刻**听到变化, 所以直接写 volume 而不走 fadeTo ——
// 顺带取消在途淡入淡出, 否则那条 rAF 会一路把音量拉回旧目标值。
export function setBgmVolume(volume: number): void {
  if (!volumePref.set(volume)) return;
  if (!enabledPref.get() || bgmSuspended) return;
  const id = currentBgm;
  if (!id) return;
  cancelFade(id);
  audioById[id].volume = trackVolume(id);
}

export function setBgmSuspended(suspended: boolean): void {
  if (bgmSuspended === suspended) return;
  bgmSuspended = suspended;
  if (suspended) {
    stopAllBgm({ rewind: true });
  } else if (requestedBgm) {
    playBgm(requestedBgm);
  }
}

function stopAudio(id: BgmId, options: { rewind?: boolean; fade?: boolean }): void {
  const shouldRewind = options.rewind === true;
  const shouldFade = options.fade === true;
  cancelFade(id);

  const audio = audioById[id];
  if (shouldRewind) rewindPending.add(id);
  else rewindPending.delete(id);
  const pause = () => {
    audio.pause();
    if (shouldRewind) {
      audio.currentTime = 0;
      rewindPending.delete(id);
    }
  };
  if (shouldFade && !audio.paused && audio.volume > 0) {
    fadeTo(id, 0, pause);
  } else {
    pause();
    audio.volume = 0;
  }
}

export function stopBgm(id: BgmId, options: { rewind?: boolean; fade?: boolean } = {}): void {
  if (requestedBgm === id) {
    requestedBgm = null;
    removeUnlockListeners();
  }
  if (currentBgm === id) currentBgm = null;
  stopAudio(id, options);
}

export function stopAllBgm(options: { rewind?: boolean; fade?: boolean } = {}): void {
  requestedBgm = null;
  currentBgm = null;
  removeUnlockListeners();

  for (const id of Object.keys(audioById) as BgmId[]) {
    stopAudio(id, options);
  }
}
