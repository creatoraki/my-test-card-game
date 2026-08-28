export const SFX_IDS = [
  "hover",
  "click",
  "confirm",
  "back",
  "disabled",
  "panel",
  "shatter",
  "ripple",
  "cardPlay",
  "cardDraw",
  "hit",
  "victory",
  "defeat",
] as const;

export type SfxId = (typeof SFX_IDS)[number];

export interface SfxFilter {
  type: BiquadFilterType;
  frequency: number;
  endFrequency?: number;
  q?: number;
}

export interface ToneLayer {
  kind: "tone";
  waveform: OscillatorType;
  frequency: number;
  endFrequency?: number;
  durationMs: number;
  gain: number;
  delayMs?: number;
  attackMs?: number;
  releaseMs?: number;
}

export interface NoiseLayer {
  kind: "noise";
  durationMs: number;
  gain: number;
  delayMs?: number;
  attackMs?: number;
  releaseMs?: number;
  filter?: SfxFilter;
}

export interface SweepLayer {
  kind: "sweep";
  waveform: OscillatorType;
  from: number;
  to: number;
  durationMs: number;
  gain: number;
  delayMs?: number;
  attackMs?: number;
  releaseMs?: number;
}

export interface BurstLayer {
  kind: "burst";
  countMin: number;
  countMax: number;
  frequencyMin: number;
  frequencyMax: number;
  durationMs: number;
  gain: number;
  spreadMs: number;
  delayMs?: number;
  attackMs?: number;
  releaseMs?: number;
}

export type SfxLayer = ToneLayer | NoiseLayer | SweepLayer | BurstLayer;

export interface SfxRecipe {
  layers: readonly SfxLayer[];
  throttleMs?: number;
}

export interface PlaySfxOptions {
  volume?: number;
  pitch?: number;
  damage?: number;
}

export function isSfxId(value: string): value is SfxId {
  return (SFX_IDS as readonly string[]).includes(value);
}
