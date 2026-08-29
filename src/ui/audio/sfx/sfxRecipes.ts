import type { SfxId, SfxRecipe } from "./sfxTypes";

export const SFX_RECIPES: Partial<Record<SfxId, SfxRecipe>> = {
  confirm: {
    layers: [
      { kind: "tone", waveform: "sine", frequency: 440, durationMs: 125, gain: 0.13, releaseMs: 70 },
      { kind: "tone", waveform: "sine", frequency: 660, durationMs: 180, gain: 0.12, delayMs: 62, releaseMs: 110 },
      { kind: "noise", durationMs: 260, gain: 0.018, delayMs: 100, filter: { type: "highpass", frequency: 3200, q: 0.5 } },
    ],
  },
  back: {
    layers: [
      { kind: "tone", waveform: "triangle", frequency: 330, durationMs: 115, gain: 0.11, releaseMs: 72 },
      { kind: "tone", waveform: "triangle", frequency: 220, durationMs: 150, gain: 0.095, delayMs: 48, releaseMs: 90 },
    ],
  },
  disabled: {
    layers: [
      { kind: "tone", waveform: "sine", frequency: 92, endFrequency: 68, durationMs: 115, gain: 0.12, attackMs: 2, releaseMs: 78 },
    ],
  },
  shatter: {
    layers: [
      { kind: "sweep", waveform: "sine", from: 150, to: 42, durationMs: 220, gain: 0.26, releaseMs: 130 },
      { kind: "noise", durationMs: 360, gain: 0.15, filter: { type: "highpass", frequency: 1350, endFrequency: 4200, q: 0.7 } },
      { kind: "burst", countMin: 10, countMax: 16, frequencyMin: 1800, frequencyMax: 5200, durationMs: 54, gain: 0.065, spreadMs: 420, delayMs: 100, releaseMs: 34 },
    ],
  },
  ripple: {
    layers: [
      { kind: "sweep", waveform: "triangle", from: 58, to: 34, durationMs: 1220, gain: 0.2, releaseMs: 420 },
      { kind: "noise", durationMs: 980, gain: 0.025, delayMs: 40, filter: { type: "lowpass", frequency: 180, endFrequency: 80, q: 0.5 }, releaseMs: 360 },
    ],
  },
  cardDraw: {
    layers: [
      { kind: "noise", durationMs: 115, gain: 0.045, filter: { type: "bandpass", frequency: 900, endFrequency: 2600, q: 1.1 } },
    ],
  },
  victory: {
    layers: [
      { kind: "tone", waveform: "sine", frequency: 523, durationMs: 180, gain: 0.12, releaseMs: 100 },
      { kind: "tone", waveform: "sine", frequency: 659, durationMs: 190, gain: 0.12, delayMs: 110, releaseMs: 100 },
      { kind: "tone", waveform: "sine", frequency: 784, durationMs: 320, gain: 0.13, delayMs: 220, releaseMs: 180 },
    ],
  },
  defeat: {
    layers: [
      { kind: "sweep", waveform: "triangle", from: 220, to: 116, durationMs: 270, gain: 0.14, releaseMs: 160 },
      { kind: "tone", waveform: "sine", frequency: 82, endFrequency: 54, durationMs: 400, gain: 0.12, delayMs: 120, releaseMs: 260 },
    ],
  },
};
