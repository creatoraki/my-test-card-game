import type { SfxId } from "./sfxTypes";
import buttonClick from "../../../assets/sounds/音效/点击.mp3";
import healSound from "../../../assets/sounds/音效/治疗.mp3";
import panelOpen from "../../../assets/sounds/音效/弹出弹窗.wav";
import cardSlash from "../../../assets/sounds/音效/单次斩击.ogg";
import hitSound from "../../../assets/sounds/音效/被攻击.wav";
import deathSound from "../../../assets/sounds/音效/死亡音效.ogg";
import pickupSound from "../../../assets/sounds/音效/单次拾取.wav";
import pickupAllSound from "../../../assets/sounds/音效/全部拾取.wav";
import shatterSound from "../../../assets/sounds/音效/玻璃碎裂.wav";

export interface SfxSample {
  srcs: readonly string[];
  gain: number;
  throttleMs?: number;
}

export const SFX_SAMPLES: Partial<Record<SfxId, SfxSample>> = {
  click: { srcs: [buttonClick], gain: 0.36 },
  panel: { srcs: [panelOpen], gain: 0.38 },
  shatter: { srcs: [shatterSound], gain: 0.42 },
  cardPlay: { srcs: [cardSlash], gain: 0.42 },
  heal: { srcs: [healSound], gain: 0.42 },
  hit: { srcs: [hitSound], gain: 0.42 },
  death: { srcs: [deathSound], gain: 0.46, throttleMs: 120 },
  pickup: { srcs: [pickupSound], gain: 0.38 },
  pickupAll: { srcs: [pickupAllSound], gain: 0.44 },
};

const decodedSamples = new Map<string, AudioBuffer>();
const decodingSamples = new Map<string, Promise<AudioBuffer | null>>();
const lastVariant = new WeakMap<SfxSample, number>();

function sourceFor(sample: SfxSample): string {
  if (sample.srcs.length < 2) return sample.srcs[0];
  const previous = lastVariant.get(sample) ?? -1;
  let index = Math.floor(Math.random() * sample.srcs.length);
  if (index === previous) index = (index + 1) % sample.srcs.length;
  lastVariant.set(sample, index);
  return sample.srcs[index];
}

function startDecode(context: AudioContext, src: string): void {
  if (decodedSamples.has(src) || decodingSamples.has(src)) return;
  const request = fetch(src)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load SFX sample: ${src}`);
      return response.arrayBuffer();
    })
    .then((buffer) => context.decodeAudioData(buffer))
    .then((audioBuffer) => {
      decodedSamples.set(src, audioBuffer);
      return audioBuffer;
    })
    .catch(() => null)
    .finally(() => {
      decodingSamples.delete(src);
    });
  decodingSamples.set(src, request);
}

function decodedOrStart(context: AudioContext, src: string): AudioBuffer | null {
  const decoded = decodedSamples.get(src);
  if (decoded) return decoded;
  startDecode(context, src);
  return null;
}

export function preloadSfxSamples(context: AudioContext): void {
  const sources = new Set(
    Object.values(SFX_SAMPLES).flatMap((sample) => sample?.srcs ?? []),
  );
  for (const src of sources) startDecode(context, src);
}

export function playSample(
  context: AudioContext,
  destination: AudioNode,
  sample: SfxSample,
  { gainScale = 1, pitchScale = 1 }: { gainScale?: number; pitchScale?: number } = {},
): void {
  const src = sourceFor(sample);
  const buffer = decodedOrStart(context, src);
  if (!buffer) return;

  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  source.playbackRate.value = pitchScale;
  gain.gain.value = sample.gain * gainScale;
  source.connect(gain);
  gain.connect(destination);
  source.start();
}

export function sampleDurationMs(sample: SfxSample): number {
  const knownDurations = sample.srcs
    .map((src) => decodedSamples.get(src)?.duration ?? 0)
    .filter((duration) => duration > 0);
  if (!knownDurations.length) return 260;
  return Math.max(100, Math.max(...knownDurations) * 1000);
}