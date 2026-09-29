// 灼烧(fire, GLSL 基础档) —— 时间轴对齐 src/ui/battle/fx/GlslHitFx/shaders/fire.glsl.ts:
//   0~180 火星旋聚、核心闪烁变亮(点燃) → 180 火团爆燃、火舌上卷 → 余烬全向迸出后上飘(至 760)。
import { createBus, crackle, noise, reverb, saturate, tone } from "../dsp.mjs";

export const IMPACT_MS = 180;

export function cast() {
  const bus = createBus(IMPACT_MS + 300);
  // 点燃的「呼」: 低通扫开的反向渐强。
  noise(bus, { dur: 200, gain: 0.6, attack: 170, curve: 2, release: 20, seed: 71, filter: { type: "low", freq: [400, 3600], q: 1.1 } });
  crackle(bus, { count: 7, spread: 170, dur: 10, gain: 0.3, freqMin: 3000, freqMax: 8000, seed: 72 });
  tone(bus, { dur: 190, gain: 0.25, attack: 160, curve: 2, release: 20, freq: [60, 110] });
  reverb(bus, { mix: 0.15, room: 0.4, damp: 0.5 });
  return bus;
}

export function hit() {
  const bus = createBus(1300);
  // 爆燃: 宽频轰鸣迅速闷下去。
  noise(bus, { dur: 620, gain: 0.95, attack: 3, release: 480, seed: 73, filter: { type: "low", freq: [2800, 420], q: 0.8 } });
  tone(bus, { dur: 300, gain: 0.8, attack: 1, release: 250, freq: [130, 42] });
  // 火舌翻卷: 带呼呼抖动的中低频。
  noise(bus, { at: 20, dur: 800, gain: 0.5, attack: 40, release: 600, seed: 74, am: { rate: 11, depth: 0.5 }, filter: { type: "band", freq: [900, 260], q: 0.6 } });
  // 余烬噼啪 + 嘶嘶声。
  crackle(bus, { at: 40, count: 26, spread: 700, dur: 12, gain: 0.35, freqMin: 1500, freqMax: 7000, seed: 75 });
  noise(bus, { at: 30, dur: 520, gain: 0.16, attack: 10, release: 420, seed: 76, filter: { type: "high", freq: [5200, 3000] } });
  saturate(bus, 1.6);
  reverb(bus, { mix: 0.24, room: 0.55, damp: 0.5 });
  return bus;
}
