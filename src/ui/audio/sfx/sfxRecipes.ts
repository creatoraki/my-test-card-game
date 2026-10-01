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
  // 增益: 上扬的能量扫频托底, G5 → D6 → G6 三连上行钟音, 尾部撒一簇上滑的高频亮点与气声。
  buff: {
    layers: [
      { kind: "sweep", waveform: "sine", from: 520, to: 1560, durationMs: 360, gain: 0.06, attackMs: 40, releaseMs: 200 },
      { kind: "tone", waveform: "sine", frequency: 784, durationMs: 220, gain: 0.09, delayMs: 60, releaseMs: 140 },
      { kind: "tone", waveform: "sine", frequency: 1175, durationMs: 320, gain: 0.08, delayMs: 150, releaseMs: 220 },
      { kind: "tone", waveform: "triangle", frequency: 1568, durationMs: 420, gain: 0.05, delayMs: 230, releaseMs: 300 },
      { kind: "burst", countMin: 4, countMax: 6, frequencyMin: 2600, frequencyMax: 4200, spreadMs: 260, durationMs: 90, gain: 0.03, delayMs: 120, endRatio: 1.15 },
      { kind: "noise", durationMs: 420, gain: 0.012, delayMs: 80, attackMs: 60, releaseMs: 300, filter: { type: "highpass", frequency: 5200, q: 0.5 } },
    ],
  },
  // 卡组升级: 低频蓄能托底 + 上扬扫频, C5 → E5 → G5 → C6 琶音登顶, 尾部亮点与气声余韵。
  deckUpgrade: {
    layers: [
      { kind: "tone", waveform: "sine", frequency: 140, endFrequency: 70, durationMs: 280, gain: 0.12, attackMs: 3, releaseMs: 180 },
      { kind: "sweep", waveform: "sine", from: 180, to: 760, durationMs: 440, gain: 0.07, attackMs: 30, releaseMs: 190 },
      { kind: "tone", waveform: "sine", frequency: 523, durationMs: 170, gain: 0.09, delayMs: 80, releaseMs: 100 },
      { kind: "tone", waveform: "sine", frequency: 659, durationMs: 180, gain: 0.09, delayMs: 160, releaseMs: 110 },
      { kind: "tone", waveform: "sine", frequency: 784, durationMs: 200, gain: 0.095, delayMs: 240, releaseMs: 120 },
      { kind: "tone", waveform: "triangle", frequency: 1047, durationMs: 640, gain: 0.08, delayMs: 320, releaseMs: 420 },
      { kind: "tone", waveform: "sine", frequency: 1568, durationMs: 600, gain: 0.035, delayMs: 330, releaseMs: 400 },
      { kind: "burst", countMin: 5, countMax: 8, frequencyMin: 3000, frequencyMax: 5200, spreadMs: 380, durationMs: 90, gain: 0.028, delayMs: 300, endRatio: 1.2 },
      { kind: "noise", durationMs: 520, gain: 0.014, delayMs: 280, attackMs: 80, releaseMs: 300, filter: { type: "highpass", frequency: 4800, q: 0.5 } },
    ],
    throttleMs: 400,
  },
  // 抽卡: 左中右三张牌依次翻出(纸面擦过 + 轻扣), 随后一道上扬亮音揭晓候选。
  deckDraw: {
    layers: [
      { kind: "noise", durationMs: 95, gain: 0.06, pan: -0.35, filter: { type: "bandpass", frequency: 1100, endFrequency: 3200, q: 1.2 } },
      { kind: "noise", durationMs: 95, gain: 0.06, delayMs: 110, filter: { type: "bandpass", frequency: 1100, endFrequency: 3200, q: 1.2 } },
      { kind: "noise", durationMs: 95, gain: 0.06, delayMs: 220, pan: 0.35, filter: { type: "bandpass", frequency: 1100, endFrequency: 3200, q: 1.2 } },
      { kind: "tone", waveform: "triangle", frequency: 1800, endFrequency: 1200, durationMs: 34, gain: 0.03, delayMs: 60, pan: -0.35, attackMs: 1 },
      { kind: "tone", waveform: "triangle", frequency: 1900, endFrequency: 1260, durationMs: 34, gain: 0.03, delayMs: 170, attackMs: 1 },
      { kind: "tone", waveform: "triangle", frequency: 2000, endFrequency: 1320, durationMs: 34, gain: 0.03, delayMs: 280, pan: 0.35, attackMs: 1 },
      { kind: "sweep", waveform: "sine", from: 700, to: 1400, durationMs: 300, gain: 0.05, delayMs: 270, attackMs: 40, releaseMs: 140 },
      { kind: "tone", waveform: "sine", frequency: 1319, durationMs: 420, gain: 0.065, delayMs: 350, releaseMs: 280 },
      { kind: "burst", countMin: 3, countMax: 5, frequencyMin: 2400, frequencyMax: 3800, spreadMs: 220, durationMs: 80, gain: 0.026, delayMs: 340, endRatio: 1.12 },
    ],
    throttleMs: 300,
  },
  // 删卡: 纸面撕裂般的下行噪声 + 碎片噼啪, 下坠扫频与低频闷响收尾, 落屑往下掉。
  cardRemove: {
    layers: [
      { kind: "noise", durationMs: 360, gain: 0.07, attackMs: 10, releaseMs: 160, filter: { type: "bandpass", frequency: 3200, endFrequency: 600, q: 0.9 } },
      { kind: "crackle", countMin: 8, countMax: 12, frequencyMin: 1500, frequencyMax: 6000, spreadMs: 280, durationMs: 26, gain: 0.05, delayMs: 30, q: 6 },
      { kind: "sweep", waveform: "triangle", from: 880, to: 160, durationMs: 380, gain: 0.055, delayMs: 20, releaseMs: 170 },
      { kind: "tone", waveform: "sine", frequency: 98, endFrequency: 52, durationMs: 320, gain: 0.1, delayMs: 60, attackMs: 3, releaseMs: 140 },
      { kind: "burst", countMin: 3, countMax: 4, frequencyMin: 1200, frequencyMax: 2000, spreadMs: 160, durationMs: 110, gain: 0.024, delayMs: 140, waveform: "triangle", endRatio: 0.5 },
    ],
    throttleMs: 300,
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
