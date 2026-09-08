import { createBoolPref, createVolumePref } from "../audioPref";
import { playLayer } from "./sfxSynth";
import { SFX_RECIPES } from "./sfxRecipes";
import { playSample, preloadSfxSamples, sampleDurationMs, SFX_SAMPLES } from "./sfxSamples";
import type { PlaySfxOptions, SfxId, SfxRecipe } from "./sfxTypes";

const MASTER_GAIN = 0.38;
const MAX_ACTIVE_VOICES = 48;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// 开关与音量各自持久化(开关键名沿用旧值, 存量档案不受影响)。
const enabledPref = createBoolPref("neon-city-sfx-enabled", true);
const volumePref = createVolumePref("neon-city-sfx-volume", 1);

// 音效总线的目标增益: 关掉就是 0, 开着则按全局音效音量缩放基准增益。
function targetGain(): number {
  return enabledPref.get() ? MASTER_GAIN * volumePref.get() : 0;
}

type AudioContextConstructor = typeof AudioContext;

type AudioContextWindow = Window & {
  AudioContext?: AudioContextConstructor;
  webkitAudioContext?: AudioContextConstructor;
};

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlockHandler: (() => void) | null = null;
let activeVoices = 0;
const lastPlayedAt = new Map<SfxId, number>();

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
    masterGain.gain.value = targetGain();
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;
    masterGain.connect(compressor);
    compressor.connect(audioContext.destination);
    preloadSfxSamples(audioContext);
  }

  if (!masterGain) return null;
  if (audioContext.state !== "running") queueUnlockRetry();
  return { context: audioContext, destination: masterGain };
}

function recipeDurationMs(recipe: SfxRecipe): number {
  return Math.max(
    ...recipe.layers.map((layer) => {
      const delay = layer.delayMs ?? 0;
      return delay + layer.durationMs + (layer.kind === "burst" ? layer.spreadMs : 0) + 80;
    }),
    100,
  );
}

function recipeVoiceCost(recipe: SfxRecipe): number {
  return recipe.layers.reduce(
    (total, layer) => total + (layer.kind === "burst" ? layer.countMax : 1),
    0,
  );
}

export function playSfx(id: SfxId, options: PlaySfxOptions = {}): void {
  if (!enabledPref.get()) return;
  const sample = SFX_SAMPLES[id];
  const recipe = SFX_RECIPES[id];
  if (!sample && !recipe) return;
  const now = performance.now();
  const throttleMs = sample?.throttleMs ?? recipe?.throttleMs ?? 30;
  if (now - (lastPlayedAt.get(id) ?? -Infinity) < throttleMs) return;

  const voiceCost = sample ? 1 : recipeVoiceCost(recipe!);
  if (activeVoices + voiceCost > MAX_ACTIVE_VOICES) return;
  const bus = ensureAudioBus();
  if (!bus) return;

  lastPlayedAt.set(id, now);
  activeVoices += voiceCost;
  window.setTimeout(() => {
    activeVoices = Math.max(0, activeVoices - voiceCost);
  }, sample ? sampleDurationMs(sample) : recipeDurationMs(recipe!));

  const damagePitch = options.damage === undefined ? 1 : 1 + clamp(options.damage, 0, 50) * 0.008;
  const pitchScale = clamp((options.pitch ?? 1) * damagePitch, 0.5, 2.2);
  const gainScale = clamp(options.volume ?? 1, 0, 1);
  if (sample) {
    playSample(bus.context, bus.destination, sample, { pitchScale, gainScale });
    return;
  }

  for (const layer of recipe!.layers) {
    playLayer(bus.context, bus.destination, layer, { pitchScale, gainScale });
  }
}

// 总线已建好时把新增益推给它; 还没建(用户尚未触发过任何音效)则等 ensureAudioBus 自己读 targetGain。
function applyGain(): void {
  if (!masterGain || !audioContext) return;
  masterGain.gain.setTargetAtTime(targetGain(), audioContext.currentTime, 0.015);
}

export function getSfxEnabled(): boolean {
  return enabledPref.get();
}

export function subscribeSfxEnabled(listener: () => void): () => void {
  return enabledPref.subscribe(listener);
}

export function setSfxEnabled(enabled: boolean): void {
  if (!enabledPref.set(enabled)) return;
  applyGain();
}

export function toggleSfx(): void {
  setSfxEnabled(!enabledPref.get());
}

export function getSfxVolume(): number {
  return volumePref.get();
}

export function subscribeSfxVolume(listener: () => void): () => void {
  return volumePref.subscribe(listener);
}

export function setSfxVolume(volume: number): void {
  if (!volumePref.set(volume)) return;
  applyGain();
}
