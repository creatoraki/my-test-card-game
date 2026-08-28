// opus tab 的 demo: 快斩·单刀弧斩(quick-slash)的陈列台。
//
// 这个文件只做「舞台 + 控制台 + 时间轴读数」, 特效本体在 ../QuickSlashFx。
// 舞台按 1920×1080 设计画布搭, 内层用容器查询单位等比缩放, 保证 demo 里看到的
// 相对尺寸与实战舞台一致 —— 特效几何是按世界 px 写死的, 缩放不对就白调。
//
// 控制台上的白闪 / 抖动只是**模拟**: 正式流程里它们分别归 screenFx 与受击反馈类,
// 组件本身不做这两件事(与 blade-slash 的分工一致)。
import { useEffect, useState, type CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import { cx } from "@/ui/common/cx";
import sceneBackground from "@/assets/占位场景素材.png";
import placeholderArt from "@/assets/占位素材.png";
import { QuickSlashFx } from "../QuickSlashFx";
import { QUICK_TIMELINE } from "../QuickSlashFx/quickSlashGeometry";
import s from "./OpusQuickSlashDemo.module.css";

const PRESET: ProcFxPreset = {
  impactMs: QUICK_TIMELINE.impact,
  floatMs: 380, // 基础档位的飘字也要短, 否则数字比特效还长
  damageAtImpact: true,
};

/** 播完后再留一点余量才卸载, 否则末尾帧被截断(与 AnimPreset.hold 的约束同理)。 */
const HOLD_MS = QUICK_TIMELINE.total + 200;

// 快特效尤其需要低速档: 1x 下爆点只有几帧, 不放慢根本看不清分层。
const RATES = [
  { value: 0.2, label: "0.2x" },
  { value: 0.35, label: "0.35x" },
  { value: 0.6, label: "0.6x" },
  { value: 1, label: "1x" },
  { value: 1.4, label: "1.4x" },
] as const;

const BEATS = [
  { at: QUICK_TIMELINE.telegraph, name: "刀路预兆", desc: "一条极细白线沿斩线收紧, 让眼睛先知道刀从哪来" },
  { at: QUICK_TIMELINE.blade, name: "刃出", desc: "弧形斩痕自左上向右下贯出, 60ms 走完, 两端收尖" },
  { at: QUICK_TIMELINE.impact, name: "爆点", desc: "白核过冲 + 楔形冲击 + 扁椭圆冲击环 + 火花双扇(掉血结算点)" },
  { at: QUICK_TIMELINE.decay, name: "余韵", desc: "刀痕自中段撕细消散, 碎屑带重力下坠" },
  { at: QUICK_TIMELINE.total, name: "收尾", desc: "全部化掉, 整段只占 560ms" },
] as const;

const PUNCH_NOTES = [
  "刃出与爆点之间刻意留 60ms 停顿 —— 扫完不立刻炸, 这段留白是冲击读数的唯一来源",
  "刃出用起手极快、尾部缓收的非对称曲线, 余韵反过来用 ease-in, 一出一收对比才脆",
  "火花只往斩线法线两侧的双扇区迸射, 冲击环沿斩线拉扁 2.2 倍 —— 方向感是快特效撑得住的信息量",
  "白核过冲到 1.15 再急收到 0.2, 靠尺度落差制造闪断感, 而不是靠更亮",
  "爆点那一帧把刀身加粗到 1.7 倍再回弹, 把冲击从命中点回传到刀上",
] as const;

export function OpusQuickSlashDemo() {
  // seq 兼作重播 key: 递增即强制重新挂载, 所有 CSS 动画从头跑。
  const [seq, setSeq] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [loop, setLoop] = useState(false);
  const [flash, setFlash] = useState(true);
  const [shake, setShake] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (loop) setSeq((value) => value + 1);
      else setPlaying(false);
    }, HOLD_MS / Math.max(rate, 0.2));
    return () => window.clearTimeout(timer);
  }, [playing, seq, loop, rate]);

  const play = () => {
    setSeq((value) => value + 1);
    setPlaying(true);
  };

  // 模拟层与特效共用同一条速率, 时序读数才对得上。
  const scaled = (milliseconds: number) => `${milliseconds / Math.max(rate, 0.2)}ms`;

  return (
    <div className={s.root} style={{ "--fx-rate": rate } as CSSProperties}>
      <header className={s.header}>
        <div>
          <span className={s.kicker}>OPUS / VFX · QUICK-SLASH</span>
          <h2>快斩 · 单刀弧斩</h2>
        </div>
        <p className={s.headerNote}>
          <b>基础档位</b>特效, 对标 animations.ts 里 slash 那颗 emoji ——
          它要给每一次普通攻击、每一回合都放, 所以总长压到 <b>560ms</b>、层数压到最少,
          不追华丽, 只把打击感做实。与 blade-slash / neon-cross 那批 2 秒级的大招特效是
          两个定位: 那边靠铺陈, 这边靠<b>停顿、曲线与方向</b>。
        </p>
      </header>

      <div className={s.controls}>
        <div className={s.controlGroup}>
          <button type="button" className={s.play} onClick={play}>
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
                style={{ animationDelay: scaled(QUICK_TIMELINE.impact) }}
              />
              {playing && (
                <>
                  <QuickSlashFx key={`fx-${seq}`} preset={PRESET} />
                  <span
                    key={`float-${seq}`}
                    className={s.float}
                    style={{
                      animationDelay: scaled(QUICK_TIMELINE.impact),
                      animationDuration: scaled(PRESET.floatMs),
                    }}
                  >
                    12
                  </span>
                </>
              )}
            </div>

            {playing && flash && (
              <div
                key={`flash-${seq}`}
                className={s.flash}
                style={{
                  animationDelay: scaled(QUICK_TIMELINE.impact),
                  animationDuration: scaled(140),
                }}
              />
            )}
          </div>
        </section>

        <aside className={s.timeline} aria-label="时间轴">
          <span className={s.controlLabel}>时间轴 · 总长 {QUICK_TIMELINE.total}ms</span>
          <ol>
            {BEATS.map((beat) => (
              <li key={beat.name} className={cx(beat.at === QUICK_TIMELINE.impact && s.beatImpact)}>
                <span className={s.beatTime}>{beat.at}ms</span>
                <span className={s.beatName}>{beat.name}</span>
                <span className={s.beatDesc}>{beat.desc}</span>
              </li>
            ))}
          </ol>

          <span className={cx(s.controlLabel, s.punchTitle)}>打击感来自哪五件事</span>
          <ul className={s.punchList}>
            {PUNCH_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>

          <p className={s.note}>
            接入战斗时的预设: proc {"{"} impactMs: {QUICK_TIMELINE.impact}, floatMs: {PRESET.floatMs},
            damageAtImpact: true {"}"}、hold: 700、shake: 1、color: &quot;#dce8ff&quot;。
            hold 需 ≥ {QUICK_TIMELINE.impact + PRESET.floatMs}ms 且盖住 total {QUICK_TIMELINE.total}ms,
            否则末尾帧与飘字会被卸载截断。
          </p>
        </aside>
      </div>
    </div>
  );
}
