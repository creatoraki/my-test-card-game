import { useEffect, useState, type CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import { cx } from "@/ui/common/cx";
import sceneBackground from "@/assets/占位场景素材.png";
import placeholderArt from "@/assets/占位素材.png";
import { LunaArcSlashFx } from "../LunaArcSlashFx";
import { LUNA_TIMELINE } from "../LunaArcSlashFx/lunaArcSlashGeometry";
import s from "./LunaArcSlashDemo.module.css";

const PRESET: ProcFxPreset = {
  impactMs: LUNA_TIMELINE.impact,
  floatMs: 460,
  damageAtImpact: true,
};

const HOLD_MS = LUNA_TIMELINE.total + 300;

const RATES = [
  { value: 0.35, label: "0.35x" },
  { value: 0.6, label: "0.6x" },
  { value: 1, label: "1x" },
  { value: 1.4, label: "1.4x" },
] as const;

const BEATS = [
  { at: LUNA_TIMELINE.telegraph, name: "蓄势", desc: "月环先在目标周围收紧, 刀光尚未出手" },
  { at: LUNA_TIMELINE.draw, name: "回旋", desc: "单道赤金月弧从右下绕入, 刀锋沿弧线加速" },
  { at: LUNA_TIMELINE.contact, name: "接触", desc: "刀锋贴到目标的一瞬短暂停住, 留出顿挫" },
  { at: LUNA_TIMELINE.impact, name: "掉血爆点", desc: "切口突然张开, 冲击环与碎屑同时爆发" },
  { at: LUNA_TIMELINE.afterglow, name: "余光", desc: "残弧拖过目标后熄灭, 只留下短促余烬" },
  { at: LUNA_TIMELINE.total, name: "收刀", desc: "所有光层退出, 演出回到干净战场" },
] as const;

export function LunaArcSlashDemo() {
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

  const scaled = (milliseconds: number) => `${milliseconds / Math.max(rate, 0.25)}ms`;

  return (
    <div className={s.root} style={{ "--fx-rate": rate } as CSSProperties}>
      <header className={s.header}>
        <div>
          <span className={s.kicker}>LUNA / VFX · ECLIPSE-ARC</span>
          <h2>月蚀回旋 · 赤金弧斩</h2>
        </div>
        <p className={s.headerNote}>
          保留“蓄势、接触顿挫、掉血爆点、余光收束”的攻击节奏,
          让<b>单道回旋月弧</b>绕过目标后切入身体, 在命中瞬间留下短促<b>切口与冲击环</b>。
        </p>
      </header>

      <div className={s.controls}>
        <div className={s.controlGroup}>
          <button type="button" className={s.play} onClick={play}>
            {playing ? "重播" : "播放"}
          </button>
          <button type="button" className={cx(loop && s.on)} aria-pressed={loop} onClick={() => setLoop((value) => !value)}>
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
          <button type="button" className={cx(flash && s.on)} aria-pressed={flash} onClick={() => setFlash((value) => !value)}>
            全屏闪
          </button>
          <button type="button" className={cx(shake && s.on)} aria-pressed={shake} onClick={() => setShake((value) => !value)}>
            受击抖动
          </button>
        </div>
      </div>

      <div className={s.body}>
        <section className={s.stage} aria-label="特效舞台">
          <div className={s.canvas}>
            <img className={s.background} src={sceneBackground} alt="" />
            <div className={s.ground} />

            <div className={cx(s.targetSlot, playing && s.targetSlotHit)}>
              <img
                key={`target-${seq}`}
                className={cx(s.target, playing && shake && s.targetHit)}
                src={placeholderArt}
                alt=""
                style={{ animationDelay: scaled(LUNA_TIMELINE.impact) }}
              />
              {playing && (
                <>
                  <LunaArcSlashFx key={`fx-${seq}`} preset={PRESET} />
                  <span
                    key={`float-${seq}`}
                    className={s.float}
                    style={{
                      animationDelay: scaled(LUNA_TIMELINE.impact),
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
                  animationDelay: scaled(LUNA_TIMELINE.impact),
                  animationDuration: scaled(180),
                }}
              />
            )}
          </div>
        </section>

        <aside className={s.timeline} aria-label="时间轴">
          <span className={s.controlLabel}>时间轴 · 总长 {LUNA_TIMELINE.total}ms</span>
          <ol>
            {BEATS.map((beat) => (
              <li key={beat.name} className={cx(beat.at === LUNA_TIMELINE.impact && s.beatImpact)}>
                <span className={s.beatTime}>{(beat.at / 1000).toFixed(2)}s</span>
                <span className={s.beatName}>{beat.name}</span>
                <span className={s.beatDesc}>{beat.desc}</span>
              </li>
            ))}
          </ol>
          <p className={s.note}>
            掉血结算与飘字锚在 {LUNA_TIMELINE.impact}ms 的爆点(damageAtImpact), 接入战斗时 hold 需 ≥ {LUNA_TIMELINE.impact + PRESET.floatMs}ms。
          </p>
        </aside>
      </div>
    </div>
  );
}