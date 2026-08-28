// ============================================================================
// 疾锋·快斩(fast-slash) —— 程序化 CSS 基础攻击斩击特效(ds 专属, 纯 CSS 关键帧)。
//
// 沿用刀光斩(blade-slash) / 血光斩(blood-slash) / 霓虹交叉斩(neon-cross)的
// 同一套设计逻辑:
//   · 时间轴以 preset.impactMs(爆点)为锚, 与几何表 FAST_TIMELINE 同源;
//   · --fx-rate 整体倍速钩子 timing(), 改速率不动任何动画代码;
//   · 几何表固定常量(无渲染期随机), 组件只做「表 → DOM + 行内时序」映射;
//   · 打击感分工不变: 顿帧/震屏归相机 SHOTS, 全屏闪归 screenFx, 组件内不做。
//
// 与现有三款斩击的区分点(基础攻击的定位, 刻意拉开免得同屏糊成一片):
//   · 速度: 爆点 280ms、全场 0.72s —— 一刀见分晓, 无第二刀、无长后摇;
//   · 构图: 单刀 35° 直落斜劈 + 双残影(blade-slash 是 -62° 聚能长斩,
//     霓虹是双刀交叉, 血光是下劈蓄压), 没有收敛/蓄力段, 出刀即杀;
//   · 配色: 中性银白(blade 青蓝 / neon 青蓝×品红 / blood 血红), 收尾只留
//     刀痕余辉与少量白点, 不做 40+ 光束碎片的华丽爆裂。
//
// 节奏设计(打击感的骨架): 130ms 直觉微光 → 160ms 快刀扫过(双残影拖速) →
// 40ms 顿帧留白 → 爆点(冲击环 + 白爆 + 白点飞溅 + 刀痕依次闪亮) → 余辉速灭。
// ============================================================================

import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import { BLADE_ANGLE, BLADE_LENGTH, DOTS, FAST_TIMELINE, WOUNDS } from "./fastSlashGeometry";
import s from "./DsFastSlashFx.module.css";

// 与 BladeSlashFx / BloodSlashFx / NeonCrossFx 同源的速率钩子: --fx-rate 变大 = 整体加速。
const timing = (milliseconds: number) =>
  `calc(${milliseconds}ms / max(var(--fx-rate, 1), 0.25))`;

const asStyle = (style: Record<string, string | number>) => style as CSSProperties;

export function DsFastSlashFx({ preset }: { preset: ProcFxPreset }) {
  // 整条时间轴按「表里的爆点」与「preset 要求的爆点」之差平移, 掉血/飘字才对得上爆裂帧。
  const offset = preset.impactMs - FAST_TIMELINE.impact;
  const at = (timelineMs: number) => Math.max(0, offset + timelineMs);

  return (
    <div
      className={s["fast-wrap"]}
      style={asStyle({ "--blade-len": `${BLADE_LENGTH}px`, "--blade-angle": `${BLADE_ANGLE}deg` })}
    >
      {/* 起手微光: 出刀前的直觉。亮 130ms 后让位给爆点白核。 */}
      <div
        className={s["fast-charge"]}
        style={asStyle({
          animationDelay: `${timing(at(FAST_TIMELINE.charge))}, ${timing(at(180))}`,
          animationDuration: `${timing(130)}, ${timing(80)}`,
        })}
      />

      {/* 刀痕: 随刀展开, 爆点后最亮, 460ms 起快速熄灭 —— 全场留在最后的只有它。 */}
      <div
        className={s["fast-scar"]}
        style={asStyle({
          animationDelay: `${timing(at(FAST_TIMELINE.strike))}, ${timing(at(FAST_TIMELINE.fade))}`,
          animationDuration: `${timing(180)}, ${timing(FAST_TIMELINE.total - FAST_TIMELINE.fade)}`,
        })}
      />

      {/* 刀刃三件套: 双残影各滞后 20/40ms 拖在身后, 本体刃最亮。wrapper 只负责旋转,
          内层各自从左端 translateX 扫到右端。 */}
      <div
        className={s["fast-ghost2"]}
        style={asStyle({ animationDelay: timing(at(FAST_TIMELINE.strike + 40)), animationDuration: timing(160) })}
      />
      <div
        className={s["fast-ghost1"]}
        style={asStyle({ animationDelay: timing(at(FAST_TIMELINE.strike + 20)), animationDuration: timing(160) })}
      />
      <div
        className={s["fast-blade"]}
        style={asStyle({ animationDelay: timing(at(FAST_TIMELINE.strike)), animationDuration: timing(160) })}
      />

      {/* 爆点三件套: 冲击环 + 中心白爆, 都是爆点那一拍起手。 */}
      <div
        className={s["fast-shock"]}
        style={asStyle({ animationDelay: timing(at(FAST_TIMELINE.impact)), animationDuration: timing(300) })}
      />
      <div
        className={s["fast-burst"]}
        style={asStyle({ animationDelay: timing(at(FAST_TIMELINE.impact)), animationDuration: timing(150) })}
      />

      {/* 刀痕亮点: 沿斩线依次闪亮, 从中心向两端错峰。 */}
      {WOUNDS.map((wound, index) => (
        <span
          key={`wound-${index}`}
          className={s["fast-wound"]}
          style={asStyle({
            left: `calc(50% + ${wound.x}px)`,
            width: wound.length,
            animationDelay: timing(at(FAST_TIMELINE.impact + wound.delay)),
            animationDuration: timing(200),
          })}
        />
      ))}

      {/* 白点飞溅: 沿刀锋方向弹开, 扫完即灭。 */}
      {DOTS.map((dot, index) => (
        <span
          key={`dot-${index}`}
          className={s["fast-dot"]}
          style={asStyle({
            left: "50%",
            top: "50%",
            width: dot.size,
            height: dot.size,
            "--dot-dx": `${dot.dx}px`,
            "--dot-dy": `${dot.dy}px`,
            animationDelay: timing(at(FAST_TIMELINE.impact + dot.delay)),
            animationDuration: timing(340),
          })}
        />
      ))}
    </div>
  );
}
