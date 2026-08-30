import { BGM_TRACKS, type BgmId } from "./bgmTracks";

const FADE_MS = 600;
const BGM_ENABLED_STORAGE_KEY = "neon-city-bgm-enabled";
const clampVolume = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

function readBgmEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(BGM_ENABLED_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function persistBgmEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BGM_ENABLED_STORAGE_KEY, String(enabled));
  } catch {}
}

const audioById: Record<BgmId, HTMLAudioElement> = {
  town: createAudio("town"),
  battle: createAudio("battle"),
  elevator: createAudio("elevator"),
};

const fadeFrames: Partial<Record<BgmId, number>> = {};
const rewindPending = new Set<BgmId>();

let currentBgm: BgmId | null = null;
let requestedBgm: BgmId | null = null;
let bgmSuspended = false;
let unlockHandler: (() => void) | null = null;
let bgmEnabled = readBgmEnabled();
const bgmEnabledListeners = new Set<() => void>();

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
  fadeTo(id, BGM_TRACKS[id].volume);
}

export function playBgm(id: BgmId): void {
  requestedBgm = id;
  if (bgmSuspended) return;
  if (!bgmEnabled) {
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
  fadeTo(id, BGM_TRACKS[id].volume);
}

export function getBgmEnabled(): boolean {
  return bgmEnabled;
}

export function subscribeBgmEnabled(listener: () => void): () => void {
  bgmEnabledListeners.add(listener);
  return () => bgmEnabledListeners.delete(listener);
}

export function setBgmEnabled(enabled: boolean): void {
  if (bgmEnabled === enabled) return;
  bgmEnabled = enabled;
  persistBgmEnabled(enabled);

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

  bgmEnabledListeners.forEach((listener) => listener());
}

export function toggleBgm(): void {
  setBgmEnabled(!bgmEnabled);
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