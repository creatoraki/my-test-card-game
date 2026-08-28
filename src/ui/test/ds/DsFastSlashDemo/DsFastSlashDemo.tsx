// ds tab 的 demo: 疾锋·快斩(fast-slash)的陈列台 —— 「基础攻击特效」的第一张 FX 表。
//
// 这个文件只做「舞台 + 控制台 + 时间轴读数」, 特效本体在 ../DsFastSlashFx。
// 结构与 DsTripleSlashDemo 的陈列台同构(那是 ds 页签参考的斩击 demo 骨架):
//   1) 舞台按 1920×1080 设计画布搭, 内层用容器查询单位等比缩放, 保证 demo 里
//      看到的相对尺寸与实战舞台一致 —— 特效几何是按世界 px 写死的;
//   2) 控制台: 播放/重播 + 循环 + 速率(0.5x~2x) + 全屏闪/受击抖动模拟;
//   3) 时间轴读数与特效共用 FAST_TIMELINE, 时序永远对得上。
// 视觉换成快斩主题: 深夜蓝黑底 + 银白刀光(基础攻击就该是最干净的中性光)。
//
// 控制台上的白闪 / 抖动 / 顿帧只是**模拟**: 正式流程里它们分别归 screenFx、
// 受击反馈类和相机 SHOTS, 组件本身不做这三件事(与 NeonCrossFx 的分工一致)。
import { useEffect, useState, type CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import { cx } from "@/ui/common/cx";
import sceneBackground from "@/assets/占位场景素材.png";
import placeholderArt from "@/assets/占位素材.png";
import { DsFastSlashFx } from "../DsFastSlashFx";
import { FAST_TIMELINE } from "../DsFastSlashFx/fastSlashGeometry";
import s from "./DsFastSlashDemo.module.css";

const PRESET: ProcFxPreset = {
  impactMs: FAST_TIMELINE.impact,
  floatMs: 320,
  damageAtImpact: true,
};

/** 播完后再留一点余量才卸载, 否则末尾帧被截断(与 AnimPreset.hold 的约束同理)。 */
const HOLD_MS = FAST_TIMELINE.total + 200;

const RATES = [
  { value: 0.5, label: "0.5x" },
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
] as const;

const BEATS = [
  { at: FAST_TIMELINE.charge, name: "起手", desc: "中心一点微光渐亮 —— 出刀前的直觉, 130ms" },
  { at: FAST_TIMELINE.strike, name: "挥斩", desc: "银白刀刃沿 35° 斜劈 + 双残影拖速, 160ms 扫完全程" },
  { at: FAST_TIMELINE.impact, name: "爆点", desc: "顿帧 40ms 后炸开: 冲击环 + 中心白爆 + 白点沿刀锋飞溅 + 刀痕依次闪亮(掉血结算点)" },
  { at: FAST_TIMELINE.fade, name: "收尾", desc: "刀痕余辉快速熄灭, 白点落定 —— 全场只剩刀口一线" },
] as const;

export function DsFastSlashDemo() {
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
          <span className={s.kicker}>DS ARCHIVE / VFX · FAST-SLASH</span>
          <h2>疾锋 · 快斩</h2>
        </div>
        <p className={s.headerNote}>
          基础攻击的<b>一刀流</b>: 130ms 直觉微光 → 160ms 银白快刀(双残影拖速) →
          40ms 顿帧留白 → 爆点炸开 → 余辉速灭, 全线 0.72s。与刀光斩(聚能长斩)/
          血光斩(下劈蓄压)/ 霓虹交叉斩(双刀交叉)分开的地方是<b>速度与干净</b>:
          单刀 35° 直落, 不做收敛段, 收尾只留刀痕一线。
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
                style={{ animationDelay: scaled(FAST_TIMELINE.impact) }}
              />
              {playing && (
                <>
                  <DsFastSlashFx key={`fx-${seq}`} preset={PRESET} />
                  <span
                    key={`float-${seq}`}
                    className={s.float}
                    style={{
                      animationDelay: scaled(FAST_TIMELINE.impact),
                      animationDuration: scaled(PRESET.floatMs),
                    }}
                  >
                    24
                  </span>
                </>
              )}
            </div>

            {playing && flash && (
              <div
                key={`flash-${seq}`}
                className={s.flash}
                style={{ animationDelay: scaled(FAST_TIMELINE.impact), animationDuration: scaled(260) }}
              />
            )}
          </div>
        </section>

        <aside className={s.timeline} aria-label="时间轴">
          <span className={s.controlLabel}>时间轴 · 总长 {FAST_TIMELINE.total}ms</span>
          <ol>
            {BEATS.map((beat) => (
              <li key={beat.name} className={cx(beat.at === FAST_TIMELINE.impact && s.beatImpact)}>
                <span className={s.beatTime}>{(beat.at / 1000).toFixed(2)}s</span>
                <span className={s.beatName}>{beat.name}</span>
                <span className={s.beatDesc}>{beat.desc}</span>
              </li>
            ))}
          </ol>
          <p className={s.note}>
            掉血结算与飘字锚在 {FAST_TIMELINE.impact}ms 的爆点(damageAtImpact),
            接入战斗时 hold 需 ≥ {FAST_TIMELINE.impact + PRESET.floatMs}ms, 否则飘字被卸载截断。
          </p>
        </aside>
      </div>
    </div>
  );
}
