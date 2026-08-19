// opus tab 的 demo: 霓虹数据·交叉斩(neon-cross)的陈列台。
//
// 这个文件只做「舞台 + 控制台 + 时间轴读数」, 特效本体在 ./NeonCrossFx。
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
import { NeonCrossFx } from "./NeonCrossFx";
import { NEON_TIMELINE } from "./NeonCrossFx/neonCrossGeometry";
import s from "./OpusNeonSlashDemo.module.css";

const PRESET: ProcFxPreset = {
  impactMs: NEON_TIMELINE.impact,
  floatMs: 600,
  damageAtImpact: true,
};

/** 播完后再留一点余量才卸载, 否则末尾帧被截断(与 AnimPreset.hold 的约束同理)。 */
const HOLD_MS = NEON_TIMELINE.total + 300;

const RATES = [
  { value: 0.35, label: "0.35x" },
  { value: 0.6, label: "0.6x" },
  { value: 1, label: "1x" },
  { value: 1.4, label: "1.4x" },
] as const;

const BEATS = [
  { at: NEON_TIMELINE.scanIn, name: "锁定", desc: "目标区浮现青/品红扫描线, 轻微色差" },
  { at: NEON_TIMELINE.bladeA, name: "第一刀 ↘", desc: "青蓝刃自左上贯穿, 带拖影与刀锋火花" },
  { at: NEON_TIMELINE.bladeB, name: "第二刀 ↗", desc: "品红刃反向贯穿, 与第一刀夹角 80°" },
  { at: NEON_TIMELINE.core, name: "白核 / 坏帧", desc: "交点凝聚白核, 整层横向色差错位" },
  { at: NEON_TIMELINE.crack, name: "静默张开", desc: "十字裂痕缓慢撑开, 这段留白是为爆点蓄压" },
  { at: NEON_TIMELINE.impact, name: "爆点", desc: "像素方块崩解 + 数据碎片四散(掉血结算点)" },
  { at: NEON_TIMELINE.total, name: "收尾", desc: "扫描线与底光消散" },
] as const;

export function OpusNeonSlashDemo() {
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
          <span className={s.kicker}>OPUS / VFX · NEON-CROSS</span>
          <h2>霓虹数据 · 交叉斩</h2>
        </div>
        <p className={s.headerNote}>
          与 blade-slash(青白聚能单斜斩) / blood-slash(血色下劈) 的三点区分:
          构图是<b>双刀交叉</b>而非单线, 配色是<b>青蓝 × 品红</b>对撞而非单色系,
          收尾是<b>数码故障</b>(色差错位 / 扫描线 / 像素崩解)而非实体碎片与血花。
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
                style={{ animationDelay: scaled(NEON_TIMELINE.impact) }}
              />
              {playing && (
                <>
                  <NeonCrossFx key={`fx-${seq}`} preset={PRESET} />
                  <span
                    key={`float-${seq}`}
                    className={s.float}
                    style={{
                      animationDelay: scaled(NEON_TIMELINE.impact),
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
                  animationDelay: `${scaled(NEON_TIMELINE.core)}, ${scaled(NEON_TIMELINE.impact)}`,
                  animationDuration: `${scaled(140)}, ${scaled(320)}`,
                }}
              />
            )}
          </div>
        </section>

        <aside className={s.timeline} aria-label="时间轴">
          <span className={s.controlLabel}>时间轴 · 总长 {NEON_TIMELINE.total}ms</span>
          <ol>
            {BEATS.map((beat) => (
              <li key={beat.name} className={cx(beat.at === NEON_TIMELINE.impact && s.beatImpact)}>
                <span className={s.beatTime}>{(beat.at / 1000).toFixed(2)}s</span>
                <span className={s.beatName}>{beat.name}</span>
                <span className={s.beatDesc}>{beat.desc}</span>
              </li>
            ))}
          </ol>
          <p className={s.note}>
            掉血结算与飘字锚在 {NEON_TIMELINE.impact}ms 的爆点(damageAtImpact),
            接入战斗时 hold 需 ≥ {NEON_TIMELINE.impact + PRESET.floatMs}ms, 否则飘字被卸载截断。
          </p>
        </aside>
      </div>
    </div>
  );
}
