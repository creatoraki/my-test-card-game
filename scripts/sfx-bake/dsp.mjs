// 离线音效烘焙的 DSP 基础件: 立体声总线、振荡器、可调制滤波噪声、FM 金属音、碎响,
// 以及整轨效果(饱和、比特破碎、Freeverb 混响、归一化)。纯 JS, 无依赖, 结果确定(固定种子)。
//
// 时间单位一律 ms, 声像 pan: -1 全左 → 1 全右, 频率/声像/增益都支持 [起, 止] 两点插值。

export const SR = 44100;
const TAU = Math.PI * 2;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createBus(ms) {
  const n = Math.ceil((ms / 1000) * SR);
  return { L: new Float32Array(n), R: new Float32Array(n) };
}

const msToIndex = (ms) => Math.round((ms / 1000) * SR);

// [a, b] 或单值 → u∈[0,1] 处的值。exp = 按比例(对数)插值, 适合频率。
function ramp(value, u, exp = false) {
  if (!Array.isArray(value)) return value;
  const [a, b] = value;
  if (exp && a > 0 && b > 0) return a * Math.pow(b / a, u);
  return a + (b - a) * u;
}

// 包络: 起音用 u^curve 上凸, 释音用三次方衰减; 两段之间保持。
function envelope(t, dur, attack, release, curve = 1) {
  if (t < 0 || t > dur) return 0;
  if (attack > 0 && t < attack) return Math.pow(t / attack, curve);
  const rs = dur - release;
  if (release > 0 && t > rs) return Math.pow(1 - (t - rs) / release, 3);
  return 1;
}

function panGains(p) {
  const a = ((Math.max(-1, Math.min(1, p)) + 1) * Math.PI) / 4;
  return [Math.cos(a), Math.sin(a)];
}

// 通用写入器: fn(i, u) 逐样本返回单声道值, 叠加包络与(可移动的)声像后混入总线。
// am: { rate(Hz), depth(0~1) } 幅度颤动 —— 火焰的呼呼抖动、电流嗡鸣。
function writeVoice(bus, v, fn) {
  const start = msToIndex(v.at ?? 0);
  const n = msToIndex(v.dur);
  const attack = ((v.attack ?? 4) / 1000) * SR;
  const release = ((v.release ?? 40) / 1000) * SR;
  for (let i = 0; i < n; i++) {
    const k = start + i;
    if (k >= bus.L.length) break;
    const u = i / n;
    let amp = ramp(v.gain, u) * envelope(i, n, attack, Math.min(release, n - attack), v.curve ?? 1);
    if (amp === 0) continue;
    if (v.am) amp *= 1 - v.am.depth * 0.5 * (1 + Math.sin((TAU * v.am.rate * i) / SR));
    const s = fn(i, u) * amp;
    const [gl, gr] = panGains(ramp(v.pan ?? 0, u));
    bus.L[k] += s * gl;
    bus.R[k] += s * gr;
  }
}

// PolyBLEP 抗混叠: 锯齿/方波的高频扫频不会刺耳。
function polyBlep(t, dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}

function oscSample(wave, phase, dt) {
  switch (wave) {
    case "sine": return Math.sin(TAU * phase);
    case "triangle": return 1 - 4 * Math.abs(phase - 0.5);
    case "saw": return 2 * phase - 1 - polyBlep(phase, dt);
    case "square": {
      const sq = phase < 0.5 ? 1 : -1;
      return sq + polyBlep(phase, dt) - polyBlep((phase + 0.5) % 1, dt);
    }
    default: return 0;
  }
}

/** 振荡器。freq 可为 [起, 止](按比例滑音); vibrato: { rate, depth(半音) }。 */
export function tone(bus, v) {
  let phase = 0;
  writeVoice(bus, v, (i, u) => {
    let f = ramp(v.freq, u, true);
    if (v.vibrato) f *= Math.pow(2, (Math.sin((TAU * v.vibrato.rate * i) / SR) * v.vibrato.depth) / 12);
    const dt = f / SR;
    phase = (phase + dt) % 1;
    return oscSample(v.wave ?? "sine", phase, dt);
  });
}

/** FM 金属音: 载波 freq, 调制比 ratio, 调制指数 index 可随时间衰减 —— 刀刃余鸣的核心。 */
export function fm(bus, v) {
  let pc = 0;
  let pm = 0;
  writeVoice(bus, v, (_, u) => {
    const f = ramp(v.freq, u, true);
    pm = (pm + (f * v.ratio) / SR) % 1;
    pc = (pc + f / SR) % 1;
    return Math.sin(TAU * pc + ramp(v.index, u) * Math.sin(TAU * pm));
  });
}

// TPT 状态变量滤波器: 截止频率可逐样本调制而不爆音。
function svf() {
  let ic1 = 0;
  let ic2 = 0;
  return (x, cutoff, q, type) => {
    const g = Math.tan((Math.PI * Math.min(cutoff, SR * 0.45)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    if (type === "low") return v2;
    if (type === "band") return v1 * k;
    return x - k * v1 - v2;
  };
}

/** 滤波噪声。filter: { type: low|band|high, freq: 值或[起,止], q }。seed 固定噪声序列。 */
export function noise(bus, v) {
  const rnd = mulberry32(v.seed ?? 1);
  const filter = v.filter ? svf() : null;
  writeVoice(bus, v, (_, u) => {
    const x = rnd() * 2 - 1;
    if (!filter) return x;
    return filter(x, ramp(v.filter.freq, u, true), v.filter.q ?? 0.8, v.filter.type);
  });
}

/** 碎响: count 个带通噪声短脉冲, 在 spread 内随机散布, 每颗随机声像。 */
export function crackle(bus, v) {
  const rnd = mulberry32(v.seed ?? 7);
  for (let c = 0; c < v.count; c++) {
    noise(bus, {
      at: (v.at ?? 0) + rnd() * v.spread,
      dur: v.dur * (0.6 + rnd() * 0.8),
      gain: v.gain * (0.35 + rnd() * 0.65),
      attack: 0.4,
      release: v.dur * 0.8,
      pan: (v.pan ?? 0) + (rnd() * 2 - 1) * (v.width ?? 0.6),
      seed: Math.floor(rnd() * 1e9),
      filter: { type: "band", freq: v.freqMin + rnd() * (v.freqMax - v.freqMin), q: v.q ?? 2.2 },
    });
  }
}

/** 数字碎块: count 个随机音高的短方波, 霓虹/像素崩解用。 */
export function blips(bus, v) {
  const rnd = mulberry32(v.seed ?? 11);
  for (let c = 0; c < v.count; c++) {
    const f = v.freqMin + rnd() * (v.freqMax - v.freqMin);
    tone(bus, {
      at: (v.at ?? 0) + rnd() * v.spread,
      dur: v.dur,
      gain: v.gain * (0.5 + rnd() * 0.5),
      attack: 0.5,
      release: v.dur * 0.3,
      wave: v.wave ?? "square",
      freq: v.glide ? [f, f * v.glide] : f,
      pan: (rnd() * 2 - 1) * (v.width ?? 0.7),
    });
  }
}

// ── 整轨处理 ──────────────────────────────────────────────────────────────

export function mix(target, source, gain = 1, offsetMs = 0) {
  const off = msToIndex(offsetMs);
  for (let i = 0; i < source.L.length && i + off < target.L.length; i++) {
    target.L[i + off] += source.L[i] * gain;
    target.R[i + off] += source.R[i] * gain;
  }
}

/** tanh 软饱和: 撞击声更「实」、更响而不削波。先把峰值归到 1, drive 才是可预期的失真量。 */
export function saturate(bus, drive) {
  const peak = Math.max(1e-6, peakOf(bus));
  const norm = Math.tanh(drive);
  for (const ch of [bus.L, bus.R]) {
    for (let i = 0; i < ch.length; i++) ch[i] = Math.tanh((ch[i] / peak) * drive) / norm;
  }
}

/** 比特破碎 + 降采样保持: 数字故障质感。 */
export function bitcrush(bus, bits, hold) {
  const steps = Math.pow(2, bits - 1);
  for (const ch of [bus.L, bus.R]) {
    let held = 0;
    for (let i = 0; i < ch.length; i++) {
      if (i % hold === 0) held = Math.round(ch[i] * steps) / steps;
      ch[i] = held;
    }
  }
}

// Freeverb: 8 梳状 + 4 全通, 右声道错开 23 样本得到立体声宽度。
const COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const ALLPASSES = [556, 441, 341, 225];

function reverbChannel(input, spread, room, damp) {
  const out = new Float32Array(input.length);
  const combs = COMBS.map((len) => ({ buf: new Float32Array(len + spread), i: 0, store: 0 }));
  const alls = ALLPASSES.map((len) => ({ buf: new Float32Array(len + spread), i: 0 }));
  for (let n = 0; n < input.length; n++) {
    const x = input[n] * 0.015;
    let acc = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.store = y * (1 - damp) + c.store * damp;
      c.buf[c.i] = x + c.store * room;
      c.i = (c.i + 1) % c.buf.length;
      acc += y;
    }
    for (const a of alls) {
      const b = a.buf[a.i];
      a.buf[a.i] = acc + b * 0.5;
      acc = b - acc;
      a.i = (a.i + 1) % a.buf.length;
    }
    out[n] = acc;
  }
  return out;
}

/** 混响: mix = 湿声比例, room 0~1 = 空间大小, damp 0~1 = 高频吸收。 */
export function reverb(bus, { mix: wet = 0.25, room = 0.8, damp = 0.4 } = {}) {
  const roomSize = 0.7 + room * 0.28;
  const wetL = reverbChannel(bus.L, 0, roomSize, damp);
  const wetR = reverbChannel(bus.R, 23, roomSize, damp);
  for (let i = 0; i < bus.L.length; i++) {
    // ×3 = Freeverb 原版的湿声定标(输入端 0.015 的固定衰减在这里补回)。
    bus.L[i] = bus.L[i] * (1 - wet * 0.5) + wetL[i] * wet * 3;
    bus.R[i] = bus.R[i] * (1 - wet * 0.5) + wetR[i] * wet * 3;
  }
}

export function peakOf(...buses) {
  let peak = 0;
  for (const bus of buses) {
    for (const ch of [bus.L, bus.R]) for (const s of ch) peak = Math.max(peak, Math.abs(s));
  }
  return peak;
}

export function scale(bus, gain) {
  for (const ch of [bus.L, bus.R]) for (let i = 0; i < ch.length; i++) ch[i] *= gain;
}

/** 首尾各做一小段淡入淡出, 防止截断处咔哒声。 */
export function fadeEdges(bus, inMs = 2, outMs = 30) {
  const nIn = msToIndex(inMs);
  const nOut = msToIndex(outMs);
  const len = bus.L.length;
  for (const ch of [bus.L, bus.R]) {
    for (let i = 0; i < nIn && i < len; i++) ch[i] *= i / nIn;
    for (let i = 0; i < nOut && i < len; i++) ch[len - 1 - i] *= i / nOut;
  }
}
