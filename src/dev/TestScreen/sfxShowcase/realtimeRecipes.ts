// 实时合成版攻击音效: 与 scripts/sfx-bake/recipes 的离线版同一套节拍设计, 但只用
// Web Audio 引擎现有的层(噪声/扫频/音调/音簇/碎响)表达, 不做混响、饱和与比特破碎。
// 「施放」从特效挂载起播(层 delayMs 即动画时间轴), 「爆点」在 impactMs 起播。

import type { SfxRecipe } from "@/ui/audio";

// ── 霓虹交叉斩: 0 扫描锁定 → 550 青刃 ↘ → 750 品红刃 ↗ → 950 白核坏帧 → 1400 裂痕 → 1700 崩解 ──

const NEON_CAST: SfxRecipe = {
  layers: [
    { kind: "tone", waveform: "triangle", frequency: 82, durationMs: 1650, gain: 0.1, attackMs: 250, releaseMs: 300 },
    { kind: "burst", waveform: "square", endRatio: 1, countMin: 9, countMax: 10, frequencyMin: 1800, frequencyMax: 3400, spreadMs: 460, durationMs: 16, gain: 0.025, attackMs: 1, releaseMs: 6 },
    { kind: "tone", waveform: "square", frequency: 1568, delayMs: 200, durationMs: 60, gain: 0.025, attackMs: 1, releaseMs: 20 },
    { kind: "tone", waveform: "square", frequency: 2093, delayMs: 320, durationMs: 90, gain: 0.025, attackMs: 1, releaseMs: 30 },
    { kind: "sweep", waveform: "sawtooth", from: 2600, to: 280, delayMs: 550, durationMs: 190, gain: 0.05, attackMs: 2, releaseMs: 120, pan: -0.4 },
    { kind: "noise", delayMs: 550, durationMs: 190, gain: 0.4, attackMs: 30, releaseMs: 110, pan: -0.4, filter: { type: "bandpass", frequency: 1400, endFrequency: 7000, q: 1.3 } },
    { kind: "sweep", waveform: "sawtooth", from: 280, to: 3000, delayMs: 750, durationMs: 190, gain: 0.05, attackMs: 2, releaseMs: 120, pan: 0.4 },
    { kind: "noise", delayMs: 750, durationMs: 190, gain: 0.4, attackMs: 30, releaseMs: 110, pan: 0.4, filter: { type: "bandpass", frequency: 7000, endFrequency: 1600, q: 1.3 } },
    { kind: "noise", delayMs: 950, durationMs: 60, gain: 0.35, attackMs: 1, releaseMs: 45, filter: { type: "highpass", frequency: 5000 } },
    { kind: "burst", waveform: "square", endRatio: 1, delayMs: 950, countMin: 6, countMax: 8, frequencyMin: 300, frequencyMax: 3600, spreadMs: 90, durationMs: 22, gain: 0.045, attackMs: 1, releaseMs: 8 },
    { kind: "sweep", waveform: "sine", from: 220, to: 880, delayMs: 950, durationMs: 420, gain: 0.08, attackMs: 380, releaseMs: 30 },
    { kind: "sweep", waveform: "sine", from: 900, to: 4200, delayMs: 1400, durationMs: 300, gain: 0.05, attackMs: 285, releaseMs: 6 },
    { kind: "noise", delayMs: 1400, durationMs: 300, gain: 0.25, attackMs: 285, releaseMs: 6, filter: { type: "lowpass", frequency: 200, endFrequency: 1800 } },
  ],
};

const NEON_HIT: SfxRecipe = {
  layers: [
    { kind: "noise", durationMs: 80, gain: 0.6, attackMs: 1, releaseMs: 65, filter: { type: "bandpass", frequency: 3200, q: 0.7 } },
    { kind: "sweep", waveform: "triangle", from: 120, to: 32, durationMs: 420, gain: 0.6, attackMs: 1, releaseMs: 350 },
    { kind: "sweep", waveform: "sawtooth", from: 1600, to: 60, durationMs: 480, gain: 0.06, attackMs: 1, releaseMs: 380 },
    { kind: "burst", waveform: "square", endRatio: 0.5, delayMs: 20, countMin: 12, countMax: 14, frequencyMin: 500, frequencyMax: 4800, spreadMs: 520, durationMs: 18, gain: 0.05, attackMs: 1, releaseMs: 6 },
    { kind: "noise", durationMs: 600, gain: 0.12, attackMs: 2, releaseMs: 500, filter: { type: "highpass", frequency: 7000, endFrequency: 2500 } },
  ],
};

// ── 灼烧: 0~180 点燃 → 180 爆燃 → 余烬上飘 ──

const FIRE_CAST: SfxRecipe = {
  layers: [
    { kind: "noise", durationMs: 200, gain: 0.45, attackMs: 170, releaseMs: 20, filter: { type: "lowpass", frequency: 400, endFrequency: 3600, q: 1.1 } },
    { kind: "crackle", countMin: 5, countMax: 7, spreadMs: 170, durationMs: 10, gain: 0.26, frequencyMin: 3000, frequencyMax: 8000 },
    { kind: "sweep", waveform: "sine", from: 60, to: 110, durationMs: 190, gain: 0.16, attackMs: 160, releaseMs: 20 },
  ],
};

const FIRE_HIT: SfxRecipe = {
  layers: [
    { kind: "noise", durationMs: 620, gain: 0.7, attackMs: 3, releaseMs: 480, filter: { type: "lowpass", frequency: 2800, endFrequency: 420, q: 0.8 } },
    { kind: "sweep", waveform: "sine", from: 130, to: 42, durationMs: 300, gain: 0.5, attackMs: 1, releaseMs: 250 },
    { kind: "noise", delayMs: 20, durationMs: 800, gain: 0.35, attackMs: 40, releaseMs: 600, filter: { type: "bandpass", frequency: 900, endFrequency: 260, q: 0.6 } },
    { kind: "crackle", delayMs: 40, countMin: 14, countMax: 16, spreadMs: 700, durationMs: 12, gain: 0.3, frequencyMin: 1500, frequencyMax: 7000, q: 2.2 },
    { kind: "noise", delayMs: 30, durationMs: 520, gain: 0.1, attackMs: 10, releaseMs: 420, filter: { type: "highpass", frequency: 5200, endFrequency: 3000 } },
  ],
};

export const REALTIME_RECIPES = {
  "neon-cross": { cast: NEON_CAST, hit: NEON_HIT },
  fire: { cast: FIRE_CAST, hit: FIRE_HIT },
} as const;
