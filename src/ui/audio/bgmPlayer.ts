import { BGM_TRACKS, type BgmId } from "./bgmTracks";

const FADE_MS = 600;

const audioById: Record<BgmId, HTMLAudioElement> = {
  town: createAudio("town"),
  battle: createAudio("battle"),
};

const fadeFrames: Partial<Record<BgmId, number>> = {};

let currentBgm: BgmId | null = null;
let requestedBgm: BgmId | null = null;
let unlockHandler: (() => void) | null = null;

function createAudio(id: BgmId): HTMLAudioElement {
  const audio = new Audio(BGM_TRACKS[id].src);
  audio.loop = true;
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

  const startedAt = performance.now();
  const tick = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / FADE_MS);
    audio.volume = startVolume + (targetVolume - startVolume) * progress;
    if (progress >= 1) {
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

export function playBgm(id: BgmId): void {
  requestedBgm = id;
  if (currentBgm === id) return;

  const previousBgm = currentBgm;
  currentBgm = id;

  if (previousBgm) {
    fadeTo(previousBgm, 0, () => {
      audioById[previousBgm].pause();
    });
  }

  const nextAudio = audioById[id];
  if (id === "battle") nextAudio.currentTime = 0;
  nextAudio.volume = 0;
  requestPlayback(id);
  fadeTo(id, BGM_TRACKS[id].volume);
}

export function stopAllBgm(): void {
  requestedBgm = null;
  currentBgm = null;
  removeUnlockListeners();

  for (const id of Object.keys(audioById) as BgmId[]) {
    cancelFade(id);
    audioById[id].pause();
    audioById[id].volume = 0;
  }
}