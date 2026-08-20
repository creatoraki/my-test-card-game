// opus tab 的 demo: 霜结·碎冰交叉斩(frost-shatter)的陈列台。
//
// 这个文件只做「舞台 + 控制台 + 时间轴读数」, 特效本体在 ../FrostShatterFx。
// 舞台按 1920×1080 设计画布搭, 内层用容器查询单位等比缩放, 保证 demo 里看到的
// 相对尺寸与实战舞台一致 —— 特效几何是按世界 px 写死的, 缩放不对就白调。
//
// 控制台上的白闪 / 抖动 / 顿帧只是**模拟**: 正式流程里它们分别归 screenFx、
// 受击反馈类和相机 SHOTS, 组件本身不做这三件事(与 blade-slash 的分工一致)。
import { useEffect, useState, type CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import { cx } from "@/ui/common/cx";
import sceneBackground from "@/assets/占位场景素材.png";
import placeholderArt from "@/assets/占位素材.png";
import { FrostShatterFx } from "../FrostShatterFx";
import { FROST_TIMELINE } from "../FrostShatterFx/frostShatterGeometry";
import s from "./OpusFrostSlashDemo.module.css";

const PRESET: ProcFxPreset = {
  impactMs: FROST_TIMELINE.impact,
  floatMs: 600,
  damageAtImpact: true,
};

/** 播完后再留一点余量才卸载, 否则末尾帧被截断(与 AnimPreset.hold 的约束同理)。 */
const HOLD_MS = FROST_TIMELINE.total + 300;

const RATES = [
  { value: 0.35, label: "0.35x" },
  { value: 0.6, label: "0.6x" },
  { value: 1, label: "1x" },
  { value: 1.4, label: "1.4x" },
] as const;

const BEATS = [
  { at: FROST_TIMELINE.frostIn, name: "结霜", desc: "目标区寒气场浮现, 放射霜纹自脚下蔓延" },
  { at: FROST_TIMELINE.bladeA, name: "第一刀 ↗", desc: "冰蓝刃自左下挑起, 带寒气尾流与霜屑" },
  { at: FROST_TIMELINE.bladeB, name: "第二刀 ↘", desc: "淡紫刃反向劈落, 与第一刀夹角 80°" },
  { at: FROST_TIMELINE.core, name: "冰晶核", desc: "交点凝结六芒星核, 结霜脉冲一圈圈外推" },
  { at: FROST_TIMELINE.crack, name: "静默张开", desc: "冰面龟裂缓慢撑开, 这段留白是为爆点蓄压" },
  { at: FROST_TIMELINE.impact, name: "爆点", desc: "冰晶碎块崩解 + 冰针四散(掉血结算点)" },
  { at: FROST_TIMELINE.total, name: "收尾", desc: "寒气雾浮起后化掉, 霜纹消散" },
] as const;

export function OpusFrostSlashDemo() {
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
          <span className={s.kicker}>OPUS / VFX · FROST-SHATTER</span>
          <h2>霜结 · 碎冰交叉斩</h2>
        </div>
        <p className={s.headerNote}>
          与 neon-cross(霓虹数据·交叉斩) 的三点区分: 节拍与分层刻意保持同构,
          差别只在质感 —— 配色是<b>冰蓝 × 淡紫</b>的寒色而非霓虹对撞,
          刀形是<b>棱角冰棱</b>加霜结纹理而非圆润光带, 收尾是<b>实体冰晶崩碎</b>与寒气雾
          而非像素崩解与色差坏帧。
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
                style={{ animationDelay: scaled(FROST_TIMELINE.impact) }}
              />
              {playing && (
                <>
                  <FrostShatterFx key={`fx-${seq}`} preset={PRESET} />
                  <span
                    key={`float-${seq}`}
                    className={s.float}
                    style={{
                      animationDelay: scaled(FROST_TIMELINE.impact),
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
                  animationDelay: `${scaled(FROST_TIMELINE.core)}, ${scaled(FROST_TIMELINE.impact)}`,
                  animationDuration: `${scaled(140)}, ${scaled(320)}`,
                }}
              />
            )}
          </div>
        </section>

        <aside className={s.timeline} aria-label="时间轴">
          <span className={s.controlLabel}>时间轴 · 总长 {FROST_TIMELINE.total}ms</span>
          <ol>
            {BEATS.map((beat) => (
              <li key={beat.name} className={cx(beat.at === FROST_TIMELINE.impact && s.beatImpact)}>
                <span className={s.beatTime}>{(beat.at / 1000).toFixed(2)}s</span>
                <span className={s.beatName}>{beat.name}</span>
                <span className={s.beatDesc}>{beat.desc}</span>
              </li>
            ))}
          </ol>
          <p className={s.note}>
            掉血结算与飘字锚在 {FROST_TIMELINE.impact}ms 的爆点(damageAtImpact),
            接入战斗时 hold 需 ≥ {FROST_TIMELINE.impact + PRESET.floatMs}ms, 否则飘字被卸载截断。
          </p>
        </aside>
      </div>
    </div>
  );
}
