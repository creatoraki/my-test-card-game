import { acquireSfxBus } from "./sfxPlayer";

/** 长按充能音效句柄：松手中断调 cancel(下坠熄火)，充满调 complete(收声 + 一声满能提示)。重复调用无副作用。 */
export interface ChargeSfxHandle {
  cancel(): void;
  complete(): void;
}

// 主振荡器音高随进度指数上扬，低通截止频率同步打开，颤音越来越急，营造「蓄力将满」的紧迫感。
const PITCH_FROM = 110;
const PITCH_TO = 520;
const CUTOFF_FROM = 640;
const CUTOFF_TO = 3800;
const TREMOLO_FROM = 7;
const TREMOLO_TO = 26;
const TREMOLO_DEPTH = 0.32;
const LEVEL = 0.16;
const ATTACK_SEC = 0.06;
const CANCEL_FADE_SEC = 0.2;
const COMPLETE_FADE_SEC = 0.08;
// 兜底：持有方异常未收尾时，充满后最多再响这么久就自动停振荡器。
const OVERRUN_SEC = 0.8;

const NOOP: ChargeSfxHandle = { cancel: () => undefined, complete: () => undefined };

let current: ChargeSfxHandle | null = null;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** 在 at 时刻冻结参数当前值，清掉之后的自动化，便于接新的收尾曲线。 */
function freeze(param: AudioParam, at: number): void {
  if (typeof param.cancelAndHoldAtTime === "function") {
    param.cancelAndHoldAtTime(at);
    return;
  }
  const value = param.value;
  param.cancelScheduledValues(at);
  param.setValueAtTime(value, at);
}

function rampFrom(param: AudioParam, from: number, to: number, start: number, end: number): void {
  param.setValueAtTime(from, start);
  param.exponentialRampToValueAtTime(to, end);
}

/** 满能提示：一声短促的高音叮。 */
function playChargedPing(context: AudioContext, destination: AudioNode): void {
  const start = context.currentTime;
  const ping = context.createOscillator();
  const envelope = context.createGain();
  ping.type = "sine";
  rampFrom(ping.frequency, PITCH_TO * 4, PITCH_TO * 4.6, start, start + 0.08);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.09, start + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);
  ping.connect(envelope);
  envelope.connect(destination);
  ping.start(start);
  ping.stop(start + 0.3);
  ping.onended = () => envelope.disconnect();
}

/**
 * 开始播放长按充能音效。
 * @param durationMs 从 0 充满所需时长
 * @param from 起始进度(0~1)：松手回落途中再次按下时从当前进度续上，音高不跳变
 */
export function startChargeSfx(durationMs: number, from = 0): ChargeSfxHandle {
  current?.cancel();
  const bus = acquireSfxBus();
  if (!bus || durationMs <= 0) return NOOP;

  const { context, destination } = bus;
  const progress = Math.min(1, Math.max(0, from));
  const start = context.currentTime;
  const full = start + Math.max(0.05, ((1 - progress) * durationMs) / 1000);

  const output = context.createGain();
  output.gain.setValueAtTime(0.0001, start);
  output.gain.exponentialRampToValueAtTime(LEVEL * lerp(0.5, 1, progress), start + ATTACK_SEC);
  output.gain.linearRampToValueAtTime(LEVEL, Math.max(full, start + ATTACK_SEC + 0.01));
  output.connect(destination);

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 7;
  rampFrom(filter.frequency, lerp(CUTOFF_FROM, CUTOFF_TO, progress), CUTOFF_TO, start, full);
  filter.connect(output);

  // 颤音：LFO 叠加到一个基值 (1 - 深度) 的增益上，增益在 1-2·深度 ~ 1 之间摆动。
  const tremolo = context.createGain();
  tremolo.gain.value = 1 - TREMOLO_DEPTH;
  tremolo.connect(filter);
  const lfo = context.createOscillator();
  const lfoDepth = context.createGain();
  lfo.type = "sine";
  lfoDepth.gain.value = TREMOLO_DEPTH;
  rampFrom(lfo.frequency, lerp(TREMOLO_FROM, TREMOLO_TO, progress), TREMOLO_TO, start, full);
  lfo.connect(lfoDepth);
  lfoDepth.connect(tremolo.gain);

  const main = context.createOscillator();
  main.type = "sawtooth";
  rampFrom(main.frequency, PITCH_FROM * Math.pow(PITCH_TO / PITCH_FROM, progress), PITCH_TO, start, full);
  main.connect(tremolo);

  // 高八度微失谐的三角波，给充能声加一层电流般的拍频。
  const shimmer = context.createOscillator();
  const shimmerGain = context.createGain();
  shimmer.type = "triangle";
  shimmer.detune.value = 9;
  rampFrom(shimmer.frequency, PITCH_FROM * 2 * Math.pow(PITCH_TO / PITCH_FROM, progress), PITCH_TO * 2, start, full);
  shimmerGain.gain.value = 0.35;
  shimmer.connect(shimmerGain);
  shimmerGain.connect(tremolo);

  const oscillators = [main, shimmer, lfo];
  for (const oscillator of oscillators) {
    oscillator.start(start);
    oscillator.stop(full + OVERRUN_SEC);
  }
  main.onended = () => output.disconnect();

  let finished = false;
  const finish = (fadeSec: number, drop: boolean) => {
    if (finished) return;
    finished = true;
    if (current === handle) current = null;
    const now = context.currentTime;
    const end = now + fadeSec;
    freeze(output.gain, now);
    output.gain.exponentialRampToValueAtTime(0.0001, end);
    if (drop) {
      // 中断：音高与亮度一起下坠，像能量泄掉。
      for (const param of [main.frequency, shimmer.frequency, filter.frequency]) {
        const value = param.value;
        freeze(param, now);
        param.exponentialRampToValueAtTime(Math.max(40, value * 0.5), end);
      }
    }
    for (const oscillator of oscillators) oscillator.stop(end + 0.03);
  };

  const handle: ChargeSfxHandle = {
    cancel: () => finish(CANCEL_FADE_SEC, true),
    complete: () => {
      if (finished) return;
      finish(COMPLETE_FADE_SEC, false);
      playChargedPing(context, destination);
    },
  };
  current = handle;
  return handle;
}
