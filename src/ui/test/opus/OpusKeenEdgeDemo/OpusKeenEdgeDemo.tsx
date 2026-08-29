// opus tab 的 demo: 锐利刀锋斩(keen-edge)的陈列台。
//
// 这个文件只做「舞台 + 控制台 + 时间轴读数」, 特效本体在 ../KeenEdgeFx。
// 与其它斩击 demo 的区别: 它是**按音效做的** —— 播放时同步触发 keenEdge 采样
// (src/assets/sounds/音效/锐利刀锋.wav), 动画的每一拍都对齐该采样的实测包络。
//
// 舞台按 1920×1080 设计画布搭, 内层用容器查询单位等比缩放。
// 控制台上的白闪 / 抖动只是**模拟**: 正式流程里它们分别归 screenFx 与受击反馈类,
// 组件本身不做这两件事(与 blade-slash 的分工一致)。
import { useEffect, useState, type CSSProperties } from "react";
import { playSfx } from "@/ui/audio/sfx";
import type { ProcFxPreset } from "@/ui/battle/animations";
import { cx } from "@/ui/common/cx";
import sceneBackground from "@/assets/占位场景素材.png";
import placeholderArt from "@/assets/占位素材.png";
import { KeenEdgeFx } from "../KeenEdgeFx";
import { KEEN_TIMELINE } from "../KeenEdgeFx/keenEdgeGeometry";
import s from "./OpusKeenEdgeDemo.module.css";

const PRESET: ProcFxPreset = {
  impactMs: KEEN_TIMELINE.impact,
  floatMs: 600,
  damageAtImpact: true,
};

/** 播完后再留一点余量才卸载, 否则末尾帧被截断(与 AnimPreset.hold 的约束同理)。 */
const HOLD_MS = KEEN_TIMELINE.total + 300;

// 速率档位收敛到 0.5–1.4: playSfx 的 pitch 被钳在 0.5–2.2, 超出这个范围音画就对不上了。
const RATES = [
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x" },
  { value: 1.4, label: "1.4x" },
] as const;

const BEATS = [
  {
    at: KEEN_TIMELINE.windup,
    name: "起势",
    sound: "峰值 0.03→0.34 · 破风渐强",
    desc: "刀轨预示线浮现, 冷光点自两端沿轨汇聚",
  },
  {
    at: KEEN_TIMELINE.accel,
    name: "加速",
    sound: "峰值 0.50–0.74 · 连续摩擦",
    desc: "主刀光自左横扫, 双残影压 36 / 72ms 跟随",
  },
  {
    at: KEEN_TIMELINE.impact,
    name: "爆点",
    sound: "峰值 0.82–1.00 · 撞击峰",
    desc: "闪核炸开 + 冲击环 + 火花四散 + 垂直伤痕(掉血结算点)",
  },
  {
    at: KEEN_TIMELINE.ring,
    name: "余鸣",
    sound: "峰值 0.30–0.63 · 金属颤鸣",
    desc: "刀痕高频微颤, 冷白涟漪三圈外推 —— 这段是本特效与 blade-slash 的主要差异",
  },
  {
    at: KEEN_TIMELINE.decay,
    name: "缓降",
    sound: "峰值 0.59→0.33 · 持续嗡鸣",
    desc: "颤鸣幅度衰减, 光尘开始下沉飘落",
  },
  {
    at: KEEN_TIMELINE.fade,
    name: "消散",
    sound: "峰值 0.49→0.11 · 快速衰减",
    desc: "刀痕虚化散掉, 尘屑淡出, 与采样淡出同时收干净",
  },
  {
    at: KEEN_TIMELINE.total,
    name: "收尾",
    sound: "采样在此处淡出结束",
    desc: "画面完全清空, 无残留元素",
  },
] as const;

export function OpusKeenEdgeDemo() {
  // seq 兼作重播 key: 递增即强制重新挂载, 所有 CSS 动画从头跑。
  const [seq, setSeq] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [loop, setLoop] = useState(false);
  const [flash, setFlash] = useState(true);
  const [shake, setShake] = useState(true);
  const [muted, setMuted] = useState(false);

  // 音画同步: 变速时用 pitch 一起改采样的播放速率, 撞击峰才仍然落在 470ms 的爆点上。
  // 采样只在「起播」这一刻触发, 不放进 effect —— 否则中途改速率/静音会重新播一遍。
  const fireSfx = (playbackRate: number) => {
    if (muted) return;
    playSfx("keenEdge", { volume: 0.9, pitch: playbackRate });
  };

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (!loop) {
        setPlaying(false);
        return;
      }
      setSeq((value) => value + 1);
      fireSfx(rate);
    }, HOLD_MS / Math.max(rate, 0.25));
    return () => window.clearTimeout(timer);
  }, [playing, seq, loop, rate, muted]);

  const play = () => {
    setSeq((value) => value + 1);
    setPlaying(true);
    fireSfx(rate);
  };

  // 模拟层与特效共用同一条速率, 时序读数才对得上。
  const scaled = (milliseconds: number) => `${milliseconds / Math.max(rate, 0.25)}ms`;

  return (
    <div className={s.root} style={{ "--fx-rate": rate } as CSSProperties}>
      <header className={s.header}>
        <div>
          <span className={s.kicker}>OPUS / VFX · KEEN-EDGE</span>
          <h2>锐利刀锋斩</h2>
        </div>
        <p className={s.headerNote}>
          按 <b>锐利刀锋.wav</b> 的实测包络逐拍编排: 起势 190ms、加速到 430ms、
          <b>撞击峰锚在 470ms</b>、之后近一秒的金属颤鸣由余鸣层接住, 2450ms 与采样一同收干净。
          与 blade-slash 同族但更「锐」: 刀身收窄成尖柳叶形、边缘高对比,
          并多出一整段颤鸣与光尘衰减。
        </p>
      </header>

      <div className={s.controls}>
        <div className={s.controlGroup}>
          <button type="button" className={cx(s.play)} onClick={play}>
            {playing ? "重播" : "播放"}
          </button>
          <button
            type="button"
            className={cx(loop && s.on)}
            aria-pressed={loop}
            onClick={() => setLoop((value) => !value)}
          >
            循环
          </button>
        </div>
        <div className={s.controlGroup}>
          <span className={s.controlLabel}>速率</span>
          {RATES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cx(rate === option.value && s.on)}
              aria-pressed={rate === option.value}
              onClick={() => setRate(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className={s.controlGroup}>
          <span className={s.controlLabel}>模拟</span>
          <button
            type="button"
            className={cx(flash && s.on)}
            aria-pressed={flash}
            onClick={() => setFlash((value) => !value)}
          >
            全屏闪
          </button>
          <button
            type="button"
            className={cx(shake && s.on)}
            aria-pressed={shake}
            onClick={() => setShake((value) => !value)}
          >
            受击抖动
          </button>
          <button
            type="button"
            className={cx(muted && s.on)}
            aria-pressed={muted}
            onClick={() => setMuted((value) => !value)}
          >
            静音试播
          </button>
        </div>
      </div>

      <div className={s.body}>
        <section className={s.stage} aria-label="特效舞台">
          <div className={s.canvas}>
            <img className={s.background} src={sceneBackground} alt="" />
            <div className={s.ground} />

            {/* 施法者: 只用来给画面一个「从左打向右」的方向读数, 不参与特效。 */}
            <img className={s.actor} src={placeholderArt} alt="" />

            <div className={s.targetSlot}>
              <img
                key={`target-${seq}`}
                className={cx(s.target, playing && shake && s.targetHit)}
                src={placeholderArt}
                alt=""
                style={{ animationDelay: scaled(KEEN_TIMELINE.impact) }}
              />
              {playing && (
                <>
                  <KeenEdgeFx key={`fx-${seq}`} preset={PRESET} />
                  <span
                    key={`float-${seq}`}
                    className={s.float}
                    style={{
                      animationDelay: scaled(KEEN_TIMELINE.impact),
                      animationDuration: scaled(PRESET.floatMs),
                    }}
                  >
                    41
                  </span>
                </>
              )}
            </div>

            {playing && flash && (
              <div
                key={`flash-${seq}`}
                className={s.flash}
                style={{
                  animationDelay: `${scaled(KEEN_TIMELINE.accel)}, ${scaled(KEEN_TIMELINE.impact)}`,
                  animationDuration: `${scaled(120)}, ${scaled(300)}`,
                }}
              />
            )}
          </div>
        </section>

        <aside className={s.timeline} aria-label="时间轴">
          <span className={s.controlLabel}>时间轴 · 总长 {KEEN_TIMELINE.total}ms</span>
          <ol>
            {BEATS.map((beat) => (
              <li key={beat.name} className={cx(beat.at === KEEN_TIMELINE.impact && s.beatImpact)}>
                <span className={s.beatTime}>{(beat.at / 1000).toFixed(2)}s</span>
                <span className={s.beatName}>{beat.name}</span>
                <span className={s.beatSound}>{beat.sound}</span>
                <span className={s.beatDesc}>{beat.desc}</span>
              </li>
            ))}
          </ol>
          <p className={s.note}>
            采样以 keenEdge 注册(裁 2450ms、末尾淡出 350ms), 不影响实战在用的 slash。
            掉血结算与飘字锚在 {KEEN_TIMELINE.impact}ms 的爆点(damageAtImpact),
            接入战斗时 hold 需 ≥ {KEEN_TIMELINE.impact + PRESET.floatMs}ms。
          </p>
        </aside>
      </div>
    </div>
  );
}
