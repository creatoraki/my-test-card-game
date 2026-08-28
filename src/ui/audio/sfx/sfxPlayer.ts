import { playLayer } from "./sfxSynth";
import { SFX_RECIPES } from "./sfxRecipes";
import type { PlaySfxOptions, SfxId } from "./sfxTypes";

const SFX_ENABLED_STORAGE_KEY = "neon-city-sfx-enabled";
const MASTER_GAIN = 0.38;
const MAX_ACTIVE_VOICES = 48;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function readSfxEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SFX_ENABLED_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function persistSfxEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SFX_ENABLED_STORAGE_KEY, String(enabled));
  } catch {}
}

type AudioContextConstructor = typeof AudioContext;

type AudioContextWindow = Window & {
  webkitAudioContext?: AudioContextConstructor;
};

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlockHandler: (() => void) | null = null;
let sfxEnabled = readSfxEnabled();
let activeVoices = 0;
const lastPlayedAt = new Map<SfxId, number>();
const sfxEnabledListeners = new Set<() => void>();

function removeUnlockListeners(): void {
  if (!unlockHandler || typeof window === "undefined") return;
  window.removeEventListener("pointerdown", unlockHandler);
  window.removeEventListener("keydown", unlockHandler);
  unlockHandler = null;
}

function queueUnlockRetry(): void {
  if (unlockHandler || typeof window === "undefined") return;

  const handleUnlock = () => {
    const context = audioContext;
    if (!context) return;
    void context.resume().then(() => {
      if (context.state === "running") removeUnlockListeners();
    }).catch(() => undefined);
  };

  unlockHandler = handleUnlock;
  window.addEventListener("pointerdown", handleUnlock);
  window.addEventListener("keydown", handleUnlock);
}

function createContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Context = (window as AudioContextWindow).AudioContext ?? (window as AudioContextWindow).webkitAudioContext;
  if (!Context) return null;
  try {
    return new Context();
  } catch {
    return null;
  }
}

function ensureAudioBus(): { context: AudioContext; destination: GainNode } | null {
  if (!audioContext) {
    audioContext = createContext();
    if (!audioContext) return null;

    masterGain = audioContext.createGain();
    masterGain.gain.value = sfxEnabled ? MASTER_GAIN : 0;
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;
    masterGain.connect(compressor);
    compressor.connect(audioContext.destination);
  }

  if (!masterGain) return null;
  if (audioContext.state !== "running") queueUnlockRetry();
  return { context: audioContext, destination: masterGain };
}

function recipeDurationMs(id: SfxId): number {
  return Math.max(
    ...SFX_RECIPES[id].layers.map((layer) => {
      const delay = layer.delayMs ?? 0;
      return delay + layer.durationMs + (layer.kind === "burst" ? layer.spreadMs : 0) + 80;
    }),
    100,
  );
}

function recipeVoiceCost(id: SfxId): number {
  return SFX_RECIPES[id].layers.reduce(
    (total, layer) => total + (layer.kind === "burst" ? layer.countMax : 1),
    0,
  );
}

export function playSfx(id: SfxId, options: PlaySfxOptions = {}): void {
  if (!sfxEnabled) return;
  const recipe = SFX_RECIPES[id];
  const now = performance.now();
  const throttleMs = recipe.throttleMs ?? 30;
  if (now - (lastPlayedAt.get(id) ?? -Infinity) < throttleMs) return;

  const voiceCost = recipeVoiceCost(id);
  if (activeVoices + voiceCost > MAX_ACTIVE_VOICES) return;
  const bus = ensureAudioBus();
  if (!bus) return;

  lastPlayedAt.set(id, now);
  activeVoices += voiceCost;
  window.setTimeout(() => {
    activeVoices = Math.max(0, activeVoices - voiceCost);
  }, recipeDurationMs(id));

  const damagePitch = options.damage === undefined ? 1 : 1 + clamp(options.damage, 0, 50) * 0.008;
  const pitchScale = clamp((options.pitch ?? 1) * damagePitch, 0.5, 2.2);
  const gainScale = clamp(options.volume ?? 1, 0, 1);
  for (const layer of recipe.layers) {
    playLayer(bus.context, bus.destination, layer, { pitchScale, gainScale });
  }
}

export function getSfxEnabled(): boolean {
  return sfxEnabled;
}

export function subscribeSfxEnabled(listener: () => void): () => void {
  sfxEnabledListeners.add(listener);
  return () => sfxEnabledListeners.delete(listener);
}

export function setSfxEnabled(enabled: boolean): void {
  if (sfxEnabled === enabled) return;
  sfxEnabled = enabled;
  persistSfxEnabled(enabled);
  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(enabled ? MASTER_GAIN : 0, audioContext.currentTime, 0.015);
  }
  sfxEnabledListeners.forEach((listener) => listener());
}

export function toggleSfx(): void {
  setSfxEnabled(!sfxEnabled);
}
