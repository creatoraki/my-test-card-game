// 三段斩击(tri-slash) —— 时间轴对齐 src/ui/battle/fx/TriSlashFx/triSlashGeometry.ts:
//   0~200 第一刀 30° 划过 → 200~400 第二刀 60° 砍回(V 形) → 400~900 留白(刀刃余鸣) →
//   900~1400 十连斩逐刀加速 → 1400~1850 静默蓄压(反向吸气) → 1850 伤口延迟裂开爆点。
import { createBus, crackle, fm, noise, reverb, saturate, tone } from "../dsp.mjs";

export const IMPACT_MS = 1850;

// 十连斩的单刀时长(ms), 与几何表 slashes[2..11].dur 一致。
const FLURRY = [60, 58, 54, 52, 50, 48, 46, 44, 44, 44];

export function cast() {
  const bus = createBus(IMPACT_MS + 500);

  // 第一刀: 由左向右掠过, 带一缕高频刃光。
  noise(bus, { at: 0, dur: 210, gain: 0.55, attack: 120, curve: 2, release: 70, pan: [-0.7, 0.1], seed: 11, filter: { type: "band", freq: [1200, 5200], q: 1.2 } });
  noise(bus, { at: 20, dur: 180, gain: 0.12, attack: 100, release: 60, pan: [-0.6, 0.2], seed: 12, filter: { type: "high", freq: [6000, 9000] } });
  fm(bus, { at: 60, dur: 160, gain: 0.05, attack: 2, release: 120, freq: [5200, 3400], ratio: 1.414, index: [2, 0] });

  // 第二刀: V 形折返砍回, 更重。
  noise(bus, { at: 200, dur: 210, gain: 0.62, attack: 110, curve: 2, release: 80, pan: [0.5, -0.3], seed: 21, filter: { type: "band", freq: [1600, 6400], q: 1.2 } });
  noise(bus, { at: 220, dur: 180, gain: 0.14, attack: 100, release: 60, pan: [0.4, -0.2], seed: 22, filter: { type: "high", freq: [6500, 9500] } });

  // V 形收刀后的刀刃余鸣: 填住 400~900 的留白, 但压得很轻。
  fm(bus, { at: 390, dur: 720, gain: 0.08, attack: 1, release: 620, freq: 3150, ratio: 2.76, index: [1.6, 0.2] });
  tone(bus, { at: 390, dur: 520, gain: 0.03, attack: 1, release: 460, freq: 4730 });

  // 十连斩: 越来越快、越来越亮, 左右交替。
  let at = 900;
  FLURRY.forEach((dur, index) => {
    const side = index % 2 === 0 ? 1 : -1;
    noise(bus, {
      at,
      dur: dur + 40,
      gain: 0.42 + index * 0.012,
      attack: dur * 0.6,
      curve: 1.6,
      release: 30,
      pan: [-0.6 * side, 0.6 * side],
      seed: 100 + index,
      filter: { type: "band", freq: [2400 + index * 180, 8200], q: 1.6 },
    });
    // 刀刃切入的「嚓」: 落在每刀末尾。
    noise(bus, { at: at + dur - 6, dur: 14, gain: 0.14, attack: 0.5, release: 10, pan: 0.5 * side, seed: 200 + index, filter: { type: "high", freq: 7000 } });
    at += dur;
  });

  // 静默蓄压: 反向渐强的吸气声, 在爆点前 0ms 戛然而止。
  noise(bus, { at: 1430, dur: 420, gain: 0.28, attack: 405, curve: 2.2, release: 8, seed: 31, filter: { type: "low", freq: [250, 3000], q: 0.9 } });
  tone(bus, { at: 1430, dur: 420, gain: 0.06, attack: 405, curve: 2, release: 8, freq: [180, 360] });

  reverb(bus, { mix: 0.22, room: 0.6, damp: 0.5 });
  return bus;
}

export function hit() {
  const bus = createBus(1400);
  noise(bus, { dur: 70, gain: 0.9, attack: 0.5, release: 60, seed: 41, filter: { type: "high", freq: 1500 } });
  noise(bus, { dur: 480, gain: 0.7, attack: 1, release: 420, seed: 42, filter: { type: "low", freq: [3200, 260], q: 0.9 } });
  tone(bus, { dur: 360, gain: 0.85, attack: 1, release: 300, freq: [160, 38] });
  // 十二道伤口同时张开的撕裂声。
  noise(bus, { at: 8, dur: 140, gain: 0.4, attack: 3, release: 100, pan: [-0.4, 0.4], seed: 43, filter: { type: "band", freq: [2800, 9500], q: 2 } });
  fm(bus, { dur: 900, gain: 0.14, attack: 1, release: 820, freq: 1870, ratio: 1.49, index: [3, 0.1] });
  fm(bus, { dur: 700, gain: 0.08, attack: 1, release: 640, freq: 2810, ratio: 2.1, index: [2, 0] });
  crackle(bus, { at: 30, count: 14, spread: 420, dur: 14, gain: 0.3, freqMin: 2200, freqMax: 7800, seed: 44 });
  saturate(bus, 1.8);
  reverb(bus, { mix: 0.3, room: 0.75, damp: 0.35 });
  return bus;
}
