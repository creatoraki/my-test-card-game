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
  slash: {
    layers: [
      { kind: "noise", durationMs: 105, gain: 0.095, attackMs: 1, releaseMs: 82, filter: { type: "bandpass", frequency: 2800, endFrequency: 7600, q: 1.6 } },
      { kind: "sweep", waveform: "triangle", from: 6800, to: 2100, durationMs: 76, gain: 0.055, attackMs: 1, releaseMs: 58 },
      { kind: "tone", waveform: "sine", frequency: 5400, endFrequency: 2900, durationMs: 58, gain: 0.032, delayMs: 14, attackMs: 1, releaseMs: 44 },
    ],
    throttleMs: 90,
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
