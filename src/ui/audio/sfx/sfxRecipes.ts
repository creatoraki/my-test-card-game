import type { SfxRecipe } from "./sfxTypes";

export const SFX_RECIPES: Record<import("./sfxTypes").SfxId, SfxRecipe> = {
  hover: {
    throttleMs: 60,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 1480, durationMs: 38, gain: 0.075, releaseMs: 28 },
      {
        kind: "noise",
        durationMs: 24,
        gain: 0.018,
        delayMs: 3,
        filter: { type: "bandpass", frequency: 2300, q: 4 },
      },
    ],
  },
  click: {
    layers: [
      { kind: "sweep", waveform: "triangle", from: 460, to: 180, durationMs: 70, gain: 0.12, releaseMs: 36 },
      { kind: "noise", durationMs: 18, gain: 0.035, filter: { type: "highpass", frequency: 1800, q: 0.6 } },
    ],
  },
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
  panel: {
    layers: [
      { kind: "sweep", waveform: "sine", from: 180, to: 920, durationMs: 240, gain: 0.09, releaseMs: 100 },
      { kind: "noise", durationMs: 170, gain: 0.028, delayMs: 45, filter: { type: "bandpass", frequency: 2100, endFrequency: 4600, q: 1.4 } },
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
  cardPlay: {
    layers: [
      { kind: "noise", durationMs: 220, gain: 0.09, filter: { type: "bandpass", frequency: 520, endFrequency: 3400, q: 1.2 } },
      { kind: "tone", waveform: "triangle", frequency: 720, endFrequency: 380, durationMs: 125, gain: 0.09, delayMs: 18, releaseMs: 80 },
    ],
  },
  cardDraw: {
    layers: [
      { kind: "noise", durationMs: 115, gain: 0.045, filter: { type: "bandpass", frequency: 900, endFrequency: 2600, q: 1.1 } },
    ],
  },
  hit: {
    layers: [
      { kind: "sweep", waveform: "sine", from: 125, to: 48, durationMs: 180, gain: 0.19, releaseMs: 110 },
      { kind: "noise", durationMs: 140, gain: 0.095, delayMs: 8, filter: { type: "bandpass", frequency: 480, endFrequency: 180, q: 0.9 }, releaseMs: 72 },
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
