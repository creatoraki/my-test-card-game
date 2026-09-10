// opus tab 的 demo: 二连箭(twin-arrow)攻击特效的陈列台。
//
// 这个文件只做「舞台 + 控制台 + 时间轴读数」, 特效本体在 ../TwinArrowFx。
// 原型是 html-templates/二连箭攻击特效.html, 组件化时做了两处改动:
//   1. 弓从金棕实木改成**纯光团**(四层暖金发光弧, 无材质无硬边);
//   2. 原型自带的背景/怪物/暗角/屏幕抖动被剥离 —— 背景与立绘归舞台,
//      全屏闪与受击抖动归下面的「模拟」开关(正式流程里分属 screenFx 与受击反馈类)。
//
// 舞台按 1920×1080 设计画布搭, 内层用容器查询单位等比缩放 —— 特效几何是世界 px
// 写死的, 这样 demo 与实战舞台的相对尺寸一致。
//
// 本特效是**两段伤害**: 时间轴上有两个命中时刻, 飘字与受击抖动各来两次,
// 时刻由 twinArrowHitTimes() 给出(它会跟着 preset.impactMs 一起缩放)。
import { useEffect, useState, type CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import { cx } from "@/ui/common/cx";
import sceneBackground from "@/assets/占位场景素材.png";
import placeholderArt from "@/assets/占位素材.png";
import { TwinArrowFx, twinArrowHitTimes } from "../TwinArrowFx";
import { TWIN_ARROW_TIMELINE } from "../TwinArrowFx/twinArrowGeometry";
import s from "./OpusTwinArrowDemo.module.css";

// impactMs 锚第一箭命中: 第二箭由几何表顺推, 两段各自结算。
const PRESET: ProcFxPreset = {
  impactMs: TWIN_ARROW_TIMELINE.hit1,
  floatMs: 600,
  damageAtImpact: true,
};

const HIT_TIMES = twinArrowHitTimes(PRESET);

/** 播完后再留一点余量才卸载, 否则末尾帧被截断(与 AnimPreset.hold 的约束同理)。 */
const HOLD_MS = TWIN_ARROW_TIMELINE.total + 300;

const RATES = [
  { value: 0.5, label: "0.5倍" },
  { value: 0.75, label: "0.75倍" },
  { value: 1, label: "1倍" },
  { value: 1.4, label: "1.4倍" },
] as const;

/** 两段伤害的演示数值: 第一箭轻、第二箭重(补刀)。 */
const DAMAGE = [23, 26] as const;

const BEATS = [
  {
    at: TWIN_ARROW_TIMELINE.windup,
    name: "起势",
    desc: "光团弓在持弓手前方成形: 四层暖金弧 + 弓梢能量结亮起, 弓弦开始后拉",
    hit: false,
  },
  {
    at: TWIN_ARROW_TIMELINE.fire1,
    name: "首发",
    desc: "拉满放弦, 第一支青白光箭离弦, 蓄力球随之熄灭",
    hit: false,
  },
  {
    at: TWIN_ARROW_TIMELINE.fire2,
    name: "二发",
    desc: "弓弦二次拉满放箭 —— 此刻第一箭还在飞, 两箭短暂同屏, 这是二连的节奏特征",
    hit: false,
  },
  {
    at: TWIN_ARROW_TIMELINE.hit1,
    name: "首命中",
    desc: "第一段伤害结算: 冲击环 + 橙黄火花 + 暖白光爆, 落点偏目标左上",
    hit: true,
  },
  {
    at: TWIN_ARROW_TIMELINE.hit2,
    name: "二命中",
    desc: "第二段伤害结算: 同款爆点错开到目标右下, 两次命中不糊在一起",
    hit: true,
  },
  {
    at: TWIN_ARROW_TIMELINE.settle,
    name: "余波",
    desc: "火花带重力下坠, 两组冲击环继续外推变淡, 弓的光团收回待机亮度",
    hit: false,
  },
  {
    at: TWIN_ARROW_TIMELINE.total,
    name: "收尾",
    desc: "画布清空, 无残留粒子; 重播靠换 key 重挂载, 组件自身不循环",
    hit: false,
  },
] as const;

export function OpusTwinArrowDemo() {
  // seq 兼作重播 key: 递增即强制重新挂载, canvas 与 CSS 动画一起从头跑。
  const [seq, setSeq] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [loop, setLoop] = useState(false);
  const [flash, setFlash] = useState(true);
  const [shake, setShake] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (!loop) {
        setPlaying(false);
        return;
      }
      setSeq((value) => value + 1);
    }, HOLD_MS / Math.max(rate, 0.25));
    return () => window.clearTimeout(timer);
  }, [playing, seq, loop, rate]);

  const play = () => {
    setSeq((value) => value + 1);
    setPlaying(true);
  };

  // 模拟层与特效共用同一条速率(--fx-rate), 时序读数才对得上。
  const scaled = (milliseconds: number) => `${milliseconds / Math.max(rate, 0.25)}ms`;

  return (
    <div className={s.root} style={{ "--fx-rate": rate } as CSSProperties}>
      <header className={s.header}>
        <div>
          <span className={s.kicker}>OPUS 特效 · 二连箭</span>
          <h2>二连箭攻击特效</h2>
        </div>
        <p className={s.headerNote}>
          <b>纯光团弓</b>: 弓臂是四层半透明暖金弧叠加出来的光, 没有木纹、没有金属高光、
          没有任何硬边; 箭是青白纺锤光团, 命中是橙黄火花 + 暖白冲击环。
          节奏沿用美术原型: 首箭 0.24 秒离弦、<b>0.43 秒首命中</b>,
          二箭 0.40 秒离弦(与首箭同屏)、<b>0.59 秒二命中</b>, 1.40 秒收干净。
          两次命中各结算一段伤害。
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
          <div className={s.world}>
            <img className={s.background} src={sceneBackground} alt="" />
            <div className={s.ground} />

            {/* 弓手: 只给画面一个「从左下打向右上」的方向读数, 弓本体由特效绘制。 */}
            <img className={s.actor} src={placeholderArt} alt="" />

            <div className={s.targetSlot}>
              <img
                key={`target-${seq}`}
                className={cx(s.target, playing && shake && s.targetHit)}
                src={placeholderArt}
                alt=""
                style={{
                  animationDelay: `${scaled(HIT_TIMES.first)}, ${scaled(HIT_TIMES.second)}`,
                }}
              />
              {playing &&
                DAMAGE.map((value, index) => (
                  <span
                    key={`float-${seq}-${index}`}
                    className={s.float}
                    style={
                      {
                        animationDelay: scaled(index === 0 ? HIT_TIMES.first : HIT_TIMES.second),
                        animationDuration: scaled(PRESET.floatMs),
                        ["--float-dx" as string]: index === 0 ? "-54px" : "46px",
                      } as CSSProperties
                    }
                  >
                    {value}
                  </span>
                ))}
            </div>

            {playing && <TwinArrowFx key={`fx-${seq}`} preset={PRESET} />}

            {playing && flash && (
              <div
                key={`flash-${seq}`}
                className={s.flash}
                style={{
                  animationDelay: `${scaled(HIT_TIMES.first)}, ${scaled(HIT_TIMES.second)}`,
                  animationDuration: `${scaled(260)}, ${scaled(300)}`,
                }}
              />
            )}
          </div>
        </section>

        <aside className={s.timeline} aria-label="时间轴">
          <span className={s.controlLabel}>时间轴 · 总长 {TWIN_ARROW_TIMELINE.total} 毫秒</span>
          <ol>
            {BEATS.map((beat) => (
              <li key={beat.name} className={cx(beat.hit && s.beatImpact)}>
                <span className={s.beatTime}>{(beat.at / 1000).toFixed(2)} 秒</span>
                <span className={s.beatName}>{beat.name}</span>
                <span className={s.beatDesc}>{beat.desc}</span>
              </li>
            ))}
          </ol>
          <p className={s.note}>
            组件只画弓 / 蓄力 / 双箭 / 拖尾 / 命中, 震屏与全屏闪不在其内 ——
            上面的「全屏闪」「受击抖动」只是模拟(正式流程里分属 screenFx 与受击反馈类)。
            接入战斗时两段伤害分别锚在 {Math.round(HIT_TIMES.first)} 与{" "}
            {Math.round(HIT_TIMES.second)} 毫秒, hold 需不小于{" "}
            {TWIN_ARROW_TIMELINE.hit2 + PRESET.floatMs} 毫秒。本 demo 暂不配音效。
          </p>
        </aside>
      </div>
    </div>
  );
}
