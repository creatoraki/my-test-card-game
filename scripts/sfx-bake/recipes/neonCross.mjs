// 霓虹数据·交叉斩(neon-cross) —— 时间轴对齐 src/ui/battle/fx/NeonCrossFx/neonCrossGeometry.ts:
//   0 扫描线锁定 → 550 青刃 ↘ → 750 品红刃 ↗ → 950 白核凝聚 + 色差坏帧 →
//   1400 十字裂痕缓缓张开 → 1700 像素方块崩解爆点。
// 数字质感的层(扫描、坏帧、崩解)单独渲染再做比特破碎, 刀光与低频保持干净。
import { bitcrush, blips, createBus, mix, noise, reverb, saturate, tone } from "../dsp.mjs";

export const IMPACT_MS = 1700;

export function cast() {
  const length = IMPACT_MS + 400;
  const bus = createBus(length);
  const digital = createBus(length);

  // 锁定底噪: 带电流颤动的低频嗡鸣, 贯穿整个蓄势段。
  tone(bus, { dur: 1650, gain: 0.12, attack: 250, release: 300, wave: "triangle", freq: 82, vibrato: { rate: 6, depth: 0.15 }, am: { rate: 50, depth: 0.35 } });
  tone(bus, { dur: 1650, gain: 0.04, attack: 250, release: 300, freq: 164 });

  // 扫描线逐条浮现 + 两声锁定提示。
  blips(digital, { count: 16, spread: 460, dur: 16, gain: 0.08, freqMin: 1800, freqMax: 3400, seed: 51 });
  tone(digital, { at: 200, dur: 60, gain: 0.07, attack: 1, release: 20, wave: "square", freq: 1568 });
  tone(digital, { at: 320, dur: 90, gain: 0.07, attack: 1, release: 30, wave: "square", freq: 2093 });

  // 青刃 ↘: 左上砍向右下, 电子音下扫。
  tone(bus, { at: 550, dur: 190, gain: 0.14, attack: 2, release: 120, wave: "saw", freq: [2600, 280], pan: [-0.8, 0.6] });
  noise(bus, { at: 550, dur: 190, gain: 0.5, attack: 30, release: 110, pan: [-0.8, 0.6], seed: 52, filter: { type: "band", freq: [1400, 7000], q: 1.3 } });
  // 品红刃 ↗: 左下挑向右上, 电子音上扫。
  tone(bus, { at: 750, dur: 190, gain: 0.14, attack: 2, release: 120, wave: "saw", freq: [280, 3000], pan: [-0.7, 0.7] });
  noise(bus, { at: 750, dur: 190, gain: 0.5, attack: 30, release: 110, pan: [-0.7, 0.7], seed: 53, filter: { type: "band", freq: [7000, 1600], q: 1.3 } });

  // 白核凝聚: 闪白一下 + 坏帧碎块 + 带颤音的充能上扬。
  noise(bus, { at: 950, dur: 60, gain: 0.5, attack: 0.5, release: 45, seed: 54, filter: { type: "high", freq: 5000 } });
  blips(digital, { at: 950, count: 10, spread: 90, dur: 22, gain: 0.14, freqMin: 300, freqMax: 3600, seed: 55 });
  tone(bus, { at: 950, dur: 420, gain: 0.12, attack: 380, curve: 2, release: 30, freq: [220, 880], vibrato: { rate: 18, depth: 0.4 } });

  // 裂痕张开: 尖啸上扬 + 低频渐强, 在爆点前一刻收住。
  tone(bus, { at: 1400, dur: 300, gain: 0.08, attack: 285, curve: 2.5, release: 6, freq: [900, 4200] });
  noise(bus, { at: 1400, dur: 300, gain: 0.35, attack: 285, curve: 2.5, release: 6, seed: 56, filter: { type: "low", freq: [200, 1800] } });

  bitcrush(digital, 7, 3);
  mix(bus, digital, 1);
  reverb(bus, { mix: 0.2, room: 0.5, damp: 0.6 });
  return bus;
}

export function hit() {
  const bus = createBus(1400);
  const digital = createBus(1400);
  noise(bus, { dur: 80, gain: 0.9, attack: 0.5, release: 65, seed: 61, filter: { type: "band", freq: 3200, q: 0.7 } });
  tone(bus, { dur: 420, gain: 0.9, attack: 1, release: 350, wave: "triangle", freq: [120, 32] });
  noise(bus, { dur: 600, gain: 0.18, attack: 2, release: 500, pan: [-0.3, 0.3], seed: 62, filter: { type: "high", freq: [7000, 2500] } });
  // 断电下坠 + 像素块四散: 进数字总线做破碎。
  tone(digital, { dur: 480, gain: 0.18, attack: 1, release: 380, wave: "saw", freq: [1600, 60] });
  blips(digital, { at: 20, count: 22, spread: 520, dur: 18, gain: 0.2, freqMin: 500, freqMax: 4800, glide: 0.5, seed: 63 });
  bitcrush(digital, 6, 4);
  mix(bus, digital, 1);
  saturate(bus, 2.2);
  reverb(bus, { mix: 0.28, room: 0.7, damp: 0.45 });
  return bus;
}
