// ds tab 的 demo: 流光·三段斩(triple-strike)的陈列台。
//
// 这个文件只做「舞台 + 控制台 + 时间轴读数」, 特效本体在 ../DsTripleSlashFx。
// 结构与 opus/OpusNeonSlashDemo 的陈列台同构(那是本页签参考的「斩击 demo 骨架」):
//   1) 舞台按 1920×1080 设计画布搭, 内层用容器查询单位等比缩放, 保证 demo 里
//      看到的相对尺寸与实战舞台一致 —— 特效几何是按世界 px 写死的;
//   2) 控制台: 播放/重播 + 循环 + 速率(0.35x~1.4x) + 全屏闪/受击抖动模拟;
//   3) 时间轴读数与特效共用 TRIPLE_TIMELINE, 时序永远对得上。
// 视觉换成三连段的银白 × 亮金主题: 夜紫底 + 冷银高光。
//
// 控制台上的白闪 / 抖动 / 顿帧只是**模拟**: 正式流程里它们分别归 screenFx、
// 受击反馈类和相机 SHOTS, 组件本身不做这三件事(与 NeonCrossFx 的分工一致)。
import { useEffect, useState, type CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import { cx } from "@/ui/common/cx";
import sceneBackground from "@/assets/占位场景素材.png";
import placeholderArt from "@/assets/占位素材.png";
import { DsTripleSlashFx } from "../DsTripleSlashFx";
import { TRIPLE_TIMELINE } from "../DsTripleSlashFx/tripleSlashGeometry";
import s from "./TripleSlashDemo.module.css";

const PRESET: ProcFxPreset = {
  impactMs: TRIPLE_TIMELINE.impact,
  floatMs: 600,
  damageAtImpact: true,
};

/** 播完后再留一点余量才卸载, 否则末尾帧被截断(与 AnimPreset.hold 的约束同理)。 */
const HOLD_MS = TRIPLE_TIMELINE.total + 300;

const RATES = [
  { value: 0.35, label: "0.35x" },
  { value: 0.6, label: "0.6x" },
  { value: 1, label: "1x" },
  { value: 1.4, label: "1.4x" },
] as const;

const BEATS = [
  { at: TRIPLE_TIMELINE.opener, name: "起手一刀", desc: "亮金重刃沿 38° 快速劈出, 扫完悬停" },
  { at: TRIPLE_TIMELINE.hold, name: "顿住", desc: "刀光悬停脉动 —— 危险在静止里" },
  { at: TRIPLE_TIMELINE.wind, name: "压刀蓄力", desc: "刀身原地压薄、亮度沉下 —— 爆发前的预备动作" },
  {
    at: TRIPLE_TIMELINE.shatter,
    name: "崩断扇散",
    desc: "首刀炸白后碎成五段垂直弹开, 残影扇向六连角度, 光环塌缩收拢视线, 中心白闪引出六连",
  },
  { at: TRIPLE_TIMELINE.flurry, name: "六连爆发", desc: "六道不同轨迹斩击逐刀劈出, 角度跨 200°, 扫完即灭" },
  { at: TRIPLE_TIMELINE.scars, name: "斩痕渗光", desc: "六道斩痕依次加深, 毛刺裂开(为爆点蓄压)" },
  { at: TRIPLE_TIMELINE.impact, name: "爆点", desc: "六芒冲击 + 碎片沿六向四散(掉血结算点)" },
  { at: TRIPLE_TIMELINE.total, name: "收尾", desc: "斩痕余辉熄灭, 火花余烬沉降" },
] as const;

export function DsTripleSlashDemo() {
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
    }, HOLD_MS / Math.max(rate, 0.25));
    return () => window.clearTimeout(timer);
  }, [playing, seq, loop, rate]);

  const play = () => {
    setSeq((value) => value + 1);
    setPlaying(true);
  };

  // 模拟层与特效共用同一条速率, 时序读数才对得上。
  const scaled = (milliseconds: number) => `${milliseconds / Math.max(rate, 0.25)}ms`;

  return (
    <div className={s.root} style={{ "--fx-rate": rate } as CSSProperties}>
      <header className={s.header}>
        <div>
          <span className={s.kicker}>DS ARCHIVE / VFX · TRIPLE-STRIKE</span>
          <h2>流光 · 三段斩</h2>
        </div>
        <p className={s.headerNote}>
          与霓虹数据·交叉斩(双刀交叉) / 墨韵·剑意斩(水墨单斩)的三点区分:
          构图是<b>乱舞连斩</b>(起手一刀 + 顿住 + 六道不同轨迹爆发)而非交叉或单线,
          配色是<b>亮金 × 银白 × 白炽</b>的冷暖对位而非冷色对撞, 收尾是<b>斩痕灼烧</b>
          (六道刀痕渗光 + 碎片沿六向四散)而非数码故障或墨渍洇开。
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
                style={{ animationDelay: scaled(TRIPLE_TIMELINE.impact) }}
              />
              {playing && (
                <>
                  <DsTripleSlashFx key={`fx-${seq}`} preset={PRESET} />
                  <span
                    key={`float-${seq}`}
                    className={s.float}
                    style={{
                      animationDelay: scaled(TRIPLE_TIMELINE.impact),
                      animationDuration: scaled(PRESET.floatMs),
                    }}
                  >
                    38
                  </span>
                </>
              )}
            </div>

            {playing && flash && (
              <div
                key={`flash-${seq}`}
                className={s.flash}
                style={{
                  animationDelay: `${scaled(TRIPLE_TIMELINE.flurry)}, ${scaled(TRIPLE_TIMELINE.impact)}`,
                  animationDuration: `${scaled(140)}, ${scaled(320)}`,
                }}
              />
            )}
          </div>
        </section>

        <aside className={s.timeline} aria-label="时间轴">
          <span className={s.controlLabel}>时间轴 · 总长 {TRIPLE_TIMELINE.total}ms</span>
          <ol>
            {BEATS.map((beat) => (
              <li key={beat.name} className={cx(beat.at === TRIPLE_TIMELINE.impact && s.beatImpact)}>
                <span className={s.beatTime}>{(beat.at / 1000).toFixed(2)}s</span>
                <span className={s.beatName}>{beat.name}</span>
                <span className={s.beatDesc}>{beat.desc}</span>
              </li>
            ))}
          </ol>
          <p className={s.note}>
            掉血结算与飘字锚在 {TRIPLE_TIMELINE.impact}ms 的爆点(damageAtImpact),
            接入战斗时 hold 需 ≥ {TRIPLE_TIMELINE.impact + PRESET.floatMs}ms, 否则飘字被卸载截断。
          </p>
        </aside>
      </div>
    </div>
  );
}
