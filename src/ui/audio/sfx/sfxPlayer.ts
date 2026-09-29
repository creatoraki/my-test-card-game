import { createBoolPref, createVolumePref } from "../shared/audioPref";
import { layerEndMs, layerVoiceCost, playLayer } from "./sfxSynth";
import { SFX_RECIPES } from "./sfxRecipes";
import {
  playSample,
  preloadSampleSources,
  preloadSfxSamples,
  sampleDurationMs,
  SFX_SAMPLES,
  type SfxSample,
} from "./sfxSamples";
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

// 复音记账: 占用 cost 个复音, durationMs 后归还。
function holdVoices(cost: number, durationMs: number): void {
  activeVoices += cost;
  window.setTimeout(() => {
    activeVoices = Math.max(0, activeVoices - cost);
  }, durationMs);
}

function scaleOf(options: PlaySfxOptions) {
  const damagePitch = options.damage === undefined ? 1 : 1 + clamp(options.damage, 0, 50) * 0.008;
  return {
    pitchScale: clamp((options.pitch ?? 1) * damagePitch, 0.5, 2.2),
    gainScale: clamp(options.volume ?? 1, 0, 1),
    timeScale: 1 / clamp(options.rate ?? 1, 0.25, 4),
  };
}

function startSample(sample: SfxSample, options: PlaySfxOptions): boolean {
  if (activeVoices + 1 > MAX_ACTIVE_VOICES) return false;
  const bus = ensureAudioBus();
  if (!bus) return false;
  holdVoices(1, sampleDurationMs(sample));
  playSample(bus.context, bus.destination, sample, scaleOf(options));
  return true;
}

// 配方按层逐个归还复音: 长时间轴配方(整段出招)的早段层播完就释放, 不会把爆点音挤掉。
function startRecipe(recipe: SfxRecipe, options: PlaySfxOptions): boolean {
  const total = recipe.layers.reduce((sum, layer) => sum + layerVoiceCost(layer), 0);
  if (activeVoices + total > MAX_ACTIVE_VOICES) return false;
  const bus = ensureAudioBus();
  if (!bus) return false;
  const scale = scaleOf(options);
  for (const layer of recipe.layers) {
    holdVoices(layerVoiceCost(layer), layerEndMs(layer, scale.timeScale));
    playLayer(bus.context, bus.destination, layer, scale);
  }
  return true;
}

export function playSfx(id: SfxId, options: PlaySfxOptions = {}): void {
  if (!enabledPref.get()) return;
  const sample = SFX_SAMPLES[id];
  const recipe = SFX_RECIPES[id];
  if (!sample && !recipe) return;
  const now = performance.now();
  const throttleMs = sample?.throttleMs ?? recipe?.throttleMs ?? 30;
  if (now - (lastPlayedAt.get(id) ?? -Infinity) < throttleMs) return;

  const started = sample ? startSample(sample, options) : startRecipe(recipe!, options);
  if (started) lastPlayedAt.set(id, now);
}

// 直接播放一份不在 SFX_IDS 注册表里的配方/采样(调试页试听、候选音效对比)。不做节流。
export function playSfxRecipe(recipe: SfxRecipe, options: PlaySfxOptions = {}): void {
  if (!enabledPref.get()) return;
  startRecipe(recipe, options);
}

export function playSfxSample(sample: SfxSample, options: PlaySfxOptions = {}): void {
  if (!enabledPref.get()) return;
  startSample(sample, options);
}

// 未注册采样需要提前解码, 否则首次播放会因缓冲未就绪而静音。
export function preloadSfxSample(sample: SfxSample): void {
  const bus = ensureAudioBus();
  if (bus) preloadSampleSources(bus.context, sample.srcs);
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
