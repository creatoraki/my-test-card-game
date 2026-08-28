import type { BurstLayer, NoiseLayer, SfxLayer, SweepLayer, ToneLayer } from "./sfxTypes";

export interface SynthScale {
  gainScale?: number;
  pitchScale?: number;
}

const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();

const positive = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

function startAt(context: AudioContext, delayMs = 0): number {
  return context.currentTime + Math.max(0, delayMs) / 1000;
}

function connectEnvelope(
  context: AudioContext,
  source: AudioScheduledSourceNode,
  destination: AudioNode,
  start: number,
  durationMs: number,
  gain: number,
  attackMs = 5,
  releaseMs = 24,
): void {
  const duration = Math.max(0.02, durationMs / 1000);
  const end = start + duration;
  const attack = Math.min(Math.max(0, attackMs) / 1000, duration * 0.45);
  const release = Math.min(Math.max(0, releaseMs) / 1000, duration * 0.45);
  const releaseStart = Math.max(start + attack, end - release);
  const envelope = context.createGain();
  const peak = Math.max(0.0001, gain);

  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(peak, start + attack);
  envelope.gain.setValueAtTime(peak, releaseStart);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  source.connect(envelope);
  envelope.connect(destination);
  source.start(start);
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
    destination,
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
    destination,
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

export function noise(
  context: AudioContext,
  destination: AudioNode,
  layer: NoiseLayer,
  scale: SynthScale = {},
): void {
  const source = context.createBufferSource();
  const start = startAt(context, layer.delayMs);
  const duration = Math.max(0.02, layer.durationMs / 1000);
  const filter = layer.filter ? context.createBiquadFilter() : null;
  source.buffer = getNoiseBuffer(context);

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
    filter.connect(destination);
  }

  connectEnvelope(
    context,
    source,
    filter ?? destination,
    start,
    layer.durationMs,
    layer.gain * (scale.gainScale ?? 1),
    layer.attackMs,
    layer.releaseMs,
  );
}

export function burst(
  context: AudioContext,
  destination: AudioNode,
  layer: BurstLayer,
  scale: SynthScale = {},
): void {
  const min = Math.max(1, Math.round(layer.countMin));
  const max = Math.max(min, Math.round(layer.countMax));
  const count = min + Math.floor(Math.random() * (max - min + 1));
  for (let index = 0; index < count; index++) {
    const delay = (layer.delayMs ?? 0) + Math.random() * Math.max(0, layer.spreadMs);
    const frequency = layer.frequencyMin + Math.random() * (layer.frequencyMax - layer.frequencyMin);
    toneNode(
      context,
      destination,
      "sine",
      frequency,
      frequency * 0.72,
      layer.durationMs,
      layer.gain * (scale.gainScale ?? 1),
      delay,
      layer.attackMs,
      layer.releaseMs,
      scale.pitchScale ?? 1,
    );
  }
}

export function playLayer(
  context: AudioContext,
  destination: AudioNode,
  layer: SfxLayer,
  scale: SynthScale = {},
): void {
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
  }
}
