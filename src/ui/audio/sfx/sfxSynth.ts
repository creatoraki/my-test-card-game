import type { BurstLayer, CrackleLayer, NoiseLayer, SfxLayer, SweepLayer, ToneLayer } from "./sfxTypes";

export interface SynthScale {
  gainScale?: number;
  pitchScale?: number;
  // 时间缩放: 0.5 = 所有延迟/时长/包络减半(2 倍速)。
  timeScale?: number;
}

const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();

const positive = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

function startAt(context: AudioContext, delayMs = 0): number {
  return context.currentTime + Math.max(0, delayMs) / 1000;
}

// 声像: 有 pan 就插一个 StereoPanner, 否则直连。
function panned(context: AudioContext, destination: AudioNode, pan: number | undefined): AudioNode {
  if (!pan || typeof context.createStereoPanner !== "function") return destination;
  const panner = context.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, pan));
  panner.connect(destination);
  return panner;
}

// 起音允许拉到时长的 90%(反向渐强的「吸气」音型), 释音不超过 45% 且不吃掉起音段。
function connectEnvelope(
  context: AudioContext,
  source: AudioScheduledSourceNode,
  destination: AudioNode,
  start: number,
  durationMs: number,
  gain: number,
  attackMs = 5,
  releaseMs = 24,
  offsetSec = 0,
): void {
  const duration = Math.max(0.02, durationMs / 1000);
  const end = start + duration;
  const attack = Math.min(Math.max(0, attackMs) / 1000, duration * 0.9);
  const release = Math.min(Math.max(0, releaseMs) / 1000, duration * 0.45, duration - attack);
  const releaseStart = Math.max(start + attack, end - release);
  const envelope = context.createGain();
  const peak = Math.max(0.0001, gain);

  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(peak, start + attack);
  envelope.gain.setValueAtTime(peak, releaseStart);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  source.connect(envelope);
  envelope.connect(destination);
  if (offsetSec > 0 && source instanceof AudioBufferSourceNode) source.start(start, offsetSec);
  else source.start(start);
  source.stop(end + 0.03);
}

function toneNode(
  context: AudioContext,
  destination: AudioNode,
  waveform: OscillatorType,
  frequency: number,
  endFrequency: number | undefined,
  durationMs: number,
  gain: number,
  delayMs: number | undefined,
  attackMs: number | undefined,
  releaseMs: number | undefined,
  pitchScale: number,
): void {
  const oscillator = context.createOscillator();
  const start = startAt(context, delayMs);
  const end = start + Math.max(0.02, durationMs / 1000);
  const from = positive(frequency * pitchScale, 80);
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(from, start);
  if (endFrequency !== undefined) {
    oscillator.frequency.linearRampToValueAtTime(
      positive(endFrequency * pitchScale, from),
      end,
    );
  }
  connectEnvelope(context, oscillator, destination, start, durationMs, gain, attackMs, releaseMs);
}

export function tone(
  context: AudioContext,
  destination: AudioNode,
  layer: ToneLayer,
  scale: SynthScale = {},
): void {
  toneNode(
    context,
    panned(context, destination, layer.pan),
    layer.waveform,
    layer.frequency,
    layer.endFrequency,
    layer.durationMs,
    layer.gain * (scale.gainScale ?? 1),
    layer.delayMs,
    layer.attackMs,
    layer.releaseMs,
    scale.pitchScale ?? 1,
  );
}

export function sweep(
  context: AudioContext,
  destination: AudioNode,
  layer: SweepLayer,
  scale: SynthScale = {},
): void {
  toneNode(
    context,
    panned(context, destination, layer.pan),
    layer.waveform,
    layer.from,
    layer.to,
    layer.durationMs,
    layer.gain * (scale.gainScale ?? 1),
    layer.delayMs,
    layer.attackMs,
    layer.releaseMs,
    scale.pitchScale ?? 1,
  );
}

function getNoiseBuffer(context: AudioContext): AudioBuffer {
  const cached = noiseBuffers.get(context);
  if (cached) return cached;

  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index++) {
    data[index] = Math.random() * 2 - 1;
  }
  noiseBuffers.set(context, buffer);
  return buffer;
}

// 噪声缓冲只有 1 秒: 超过 1 秒的层循环播放, 否则尾段会断音。
function noiseSource(context: AudioContext, durationSec: number): AudioBufferSourceNode {
  const source = context.createBufferSource();
  source.buffer = getNoiseBuffer(context);
  if (durationSec > 0.95) source.loop = true;
  return source;
}

export function noise(
  context: AudioContext,
  destination: AudioNode,
  layer: NoiseLayer,
  scale: SynthScale = {},
): void {
  const start = startAt(context, layer.delayMs);
  const duration = Math.max(0.02, layer.durationMs / 1000);
  const source = noiseSource(context, duration);
  const output = panned(context, destination, layer.pan);
  const filter = layer.filter ? context.createBiquadFilter() : null;

  if (filter && layer.filter) {
    filter.type = layer.filter.type;
    filter.frequency.setValueAtTime(
      positive(layer.filter.frequency * (scale.pitchScale ?? 1), 100),
      start,
    );
    if (layer.filter.endFrequency !== undefined) {
      filter.frequency.linearRampToValueAtTime(
        positive(layer.filter.endFrequency * (scale.pitchScale ?? 1), 100),
        start + duration,
      );
    }
    filter.Q.value = layer.filter.q ?? 0.7;
    filter.connect(output);
  }

  connectEnvelope(
    context,
    source,
    filter ?? output,
    start,
    layer.durationMs,
    layer.gain * (scale.gainScale ?? 1),
    layer.attackMs,
    layer.releaseMs,
  );
}

const randomIn = (min: number, max: number) => min + Math.random() * (max - min);

function randomCount(layer: { countMin: number; countMax: number }): number {
  const min = Math.max(1, Math.round(layer.countMin));
  const max = Math.max(min, Math.round(layer.countMax));
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function burst(
  context: AudioContext,
  destination: AudioNode,
  layer: BurstLayer,
  scale: SynthScale = {},
): void {
  const output = panned(context, destination, layer.pan);
  const count = randomCount(layer);
  for (let index = 0; index < count; index++) {
    const delay = (layer.delayMs ?? 0) + Math.random() * Math.max(0, layer.spreadMs);
    const frequency = randomIn(layer.frequencyMin, layer.frequencyMax);
    toneNode(
      context,
      output,
      layer.waveform ?? "sine",
      frequency,
      frequency * (layer.endRatio ?? 0.72),
      layer.durationMs,
      layer.gain * (scale.gainScale ?? 1),
      delay,
      layer.attackMs,
      layer.releaseMs,
      scale.pitchScale ?? 1,
    );
  }
}

export function crackle(
  context: AudioContext,
  destination: AudioNode,
  layer: CrackleLayer,
  scale: SynthScale = {},
): void {
  const buffer = getNoiseBuffer(context);
  const count = randomCount(layer);
  for (let index = 0; index < count; index++) {
    const start = startAt(context, (layer.delayMs ?? 0) + Math.random() * Math.max(0, layer.spreadMs));
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = positive(randomIn(layer.frequencyMin, layer.frequencyMax) * (scale.pitchScale ?? 1), 200);
    filter.Q.value = layer.q ?? 1.4;
    // 每个脉冲随机左右散开一点, 没设 pan 时也不至于全挤在正中。
    filter.connect(panned(context, destination, (layer.pan ?? 0) + randomIn(-0.35, 0.35)));
    connectEnvelope(
      context,
      source,
      filter,
      start,
      layer.durationMs,
      layer.gain * randomIn(0.45, 1) * (scale.gainScale ?? 1),
      layer.attackMs ?? 1,
      layer.releaseMs ?? layer.durationMs * 0.7,
      // 随机起读位置: 否则每个脉冲都从缓冲开头读同一段噪声, 听起来是同一颗火星在重复。
      Math.random() * 0.9,
    );
  }
}

// 按倍速压缩一层的全部时间量, 音高不动。
function scaleTime<T extends SfxLayer>(layer: T, k: number): T {
  if (k === 1) return layer;
  const spread = layer.kind === "burst" || layer.kind === "crackle"
    ? { spreadMs: (layer as BurstLayer | CrackleLayer).spreadMs * k }
    : {};
  return {
    ...layer,
    durationMs: layer.durationMs * k,
    delayMs: layer.delayMs === undefined ? undefined : layer.delayMs * k,
    attackMs: layer.attackMs === undefined ? undefined : layer.attackMs * k,
    releaseMs: layer.releaseMs === undefined ? undefined : layer.releaseMs * k,
    ...spread,
  };
}

export function playLayer(
  context: AudioContext,
  destination: AudioNode,
  rawLayer: SfxLayer,
  scale: SynthScale = {},
): void {
  const layer = scaleTime(rawLayer, scale.timeScale ?? 1);
  switch (layer.kind) {
    case "tone":
      tone(context, destination, layer, scale);
      break;
    case "noise":
      noise(context, destination, layer, scale);
      break;
    case "sweep":
      sweep(context, destination, layer, scale);
      break;
    case "burst":
      burst(context, destination, layer, scale);
      break;
    case "crackle":
      crackle(context, destination, layer, scale);
      break;
  }
}

// 单层占用的复音数与持续时长(ms, 已按 timeScale 缩放), 供播放器做复音上限记账。
export function layerVoiceCost(layer: SfxLayer): number {
  return layer.kind === "burst" || layer.kind === "crackle" ? layer.countMax : 1;
}

export function layerEndMs(layer: SfxLayer, timeScale = 1): number {
  const spread = layer.kind === "burst" || layer.kind === "crackle" ? layer.spreadMs : 0;
  return ((layer.delayMs ?? 0) + layer.durationMs + spread) * timeScale + 80;
}
