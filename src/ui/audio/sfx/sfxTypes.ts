export const SFX_IDS = [
  "click",
  "confirm",
  "back",
  "disabled",
  "panel",
  "shatter",
  "ripple",
  "cardPlay",
  "cardDraw",
  "cardHover",
  "cardSelect",
  "heal",
  "shield",
  "hit",
  "slash",
  "keenEdge",
  "victory",
  "defeat",
  "death",
  "pickup",
  "pickupAll",
] as const;

export type SfxId = (typeof SFX_IDS)[number];

export interface SfxFilter {
  type: BiquadFilterType;
  frequency: number;
  endFrequency?: number;
  q?: number;
}

// 各层共有的时序与声像字段。pan: -1 = 全左, 1 = 全右, 缺省居中。
interface LayerTiming {
  durationMs: number;
  gain: number;
  delayMs?: number;
  attackMs?: number;
  releaseMs?: number;
  pan?: number;
}

export interface ToneLayer extends LayerTiming {
  kind: "tone";
  waveform: OscillatorType;
  frequency: number;
  endFrequency?: number;
}

export interface NoiseLayer extends LayerTiming {
  kind: "noise";
  filter?: SfxFilter;
}

export interface SweepLayer extends LayerTiming {
  kind: "sweep";
  waveform: OscillatorType;
  from: number;
  to: number;
}

// 一簇随机音高的短音。waveform 缺省 sine; endRatio = 结束频率 / 起始频率, 缺省 0.72(下滑)。
export interface BurstLayer extends LayerTiming {
  kind: "burst";
  countMin: number;
  countMax: number;
  frequencyMin: number;
  frequencyMax: number;
  spreadMs: number;
  waveform?: OscillatorType;
  endRatio?: number;
}

// 一簇随机中心频率的带通噪声短脉冲: 火星噼啪、电弧、碎屑。durationMs 是单个脉冲的时长。
export interface CrackleLayer extends LayerTiming {
  kind: "crackle";
  countMin: number;
  countMax: number;
  frequencyMin: number;
  frequencyMax: number;
  spreadMs: number;
  q?: number;
}

export type SfxLayer = ToneLayer | NoiseLayer | SweepLayer | BurstLayer | CrackleLayer;

export interface SfxRecipe {
  layers: readonly SfxLayer[];
  throttleMs?: number;
}

export interface PlaySfxOptions {
  volume?: number;
  pitch?: number;
  damage?: number;
  // 时间倍速(只作用于合成配方): 2 = 全部延迟与时长减半、音高不变, 跟随战斗倍速对齐动画。
  rate?: number;
}

export function isSfxId(value: string): value is SfxId {
  return (SFX_IDS as readonly string[]).includes(value);
}
