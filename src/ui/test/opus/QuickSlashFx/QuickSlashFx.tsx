// ============================================================================
// 快斩·单刀弧斩(quick-slash) —— 程序化 CSS 斩击特效(基础档位)。
//
// 定位与 blade-slash / blood-slash / neon-cross 那批「大招级」特效不同: 它是给
// 普通攻击每回合都放的底特效, 总长只有 560ms, 层数刻意压到最少。分层逻辑照旧 ——
// 时间轴与几何全在 quickSlashGeometry.ts, 本文件只做「表 → DOM + 行内时序」的
// 纯映射, 不含随机与状态; 震屏 / 全屏闪 / 顿帧按项目分工归相机 SHOTS 与 screenFx,
// 组件内不做。
//
// 打击感由五件事撑起来(改动前先读懂它们, 少一件都会塌):
//   1. 刃出与爆点之间那 60ms 停顿 —— 扫完不立刻炸;
//   2. 刃出用起手极快、尾部缓收的非对称曲线, 余韵反过来用 ease-in;
//   3. 火花只往斩线法线两侧的双扇区炸, 冲击环沿斩线拉扁, 方向读数一致;
//   4. 白核过冲后急收, 靠尺度落差制造闪断感;
//   5. 爆点那一帧把刀身加粗一档, 冲击回传到刀上。
// ============================================================================

import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import {
  BLADE,
  DEBRIS,
  QUICK_TIMELINE,
  SHOCK,
  SPARKS,
} from "./quickSlashGeometry";
import s from "./QuickSlashFx.module.css";

// 与 BladeSlashFx / FrostShatterFx 同源的速率钩子: --fx-rate 变大 = 整体加速。
const timing = (milliseconds: number) =>
  `calc(${milliseconds}ms / max(var(--fx-rate, 1), 0.25))`;

const asStyle = (style: Record<string, string | number>) => style as CSSProperties;

export function QuickSlashFx({ preset }: { preset: ProcFxPreset }) {
  // 整条时间轴按「表里的爆点」与「preset 要求的爆点」之差平移, 掉血/飘字才对得上爆帧。
  const offset = preset.impactMs - QUICK_TIMELINE.impact;
  const at = (timelineMs: number) => Math.max(0, offset + timelineMs);

  return (
    <div
      className={s["quick-wrap"]}
      style={asStyle({
        "--blade-len": `${BLADE.length}px`,
        "--blade-thick": `${BLADE.thickness}px`,
        "--blade-angle": `${BLADE.angle}deg`,
      })}
    >
      {/* 预兆: 一条极细白线沿斩线由长收紧到一点。唯一的 anticipation, 只给 60ms。 */}
      <i
        className={s["quick-telegraph"]}
        style={asStyle({
          animationDelay: timing(at(QUICK_TIMELINE.telegraph)),
          animationDuration: timing(140),
        })}
      />

      {/* 刀身。wrapper 只旋转, 内层三条(辉光 / 刀芯 / 拖影)各自从左端扫出。
          刀芯的第二条动画是爆点那一帧的加粗回弹。 */}
      <div className={s["quick-blade"]}>
        <i
          className={s["quick-blade-glow"]}
          style={asStyle({
            animationDelay: `${timing(at(QUICK_TIMELINE.blade - 20))}, ${timing(at(QUICK_TIMELINE.decay))}`,
            animationDuration: `${timing(90)}, ${timing(240)}`,
          })}
        />
        <i
          className={s["quick-blade-core"]}
          style={asStyle({
            animationDelay: `${timing(at(QUICK_TIMELINE.blade))}, ${timing(at(QUICK_TIMELINE.impact))}, ${timing(at(QUICK_TIMELINE.decay))}`,
            animationDuration: `${timing(60)}, ${timing(90)}, ${timing(QUICK_TIMELINE.total - QUICK_TIMELINE.decay)}`,
          })}
        />
        <i
          className={s["quick-blade-ghost"]}
          style={asStyle({
            animationDelay: timing(at(QUICK_TIMELINE.blade + 30)),
            animationDuration: timing(260),
          })}
        />
      </div>

      {/* 爆点白核: 过冲到最大再急收, 尺度落差就是「闪断」的来源。 */}
      <div
        className={s["quick-core"]}
        style={asStyle({
          animationDelay: timing(at(QUICK_TIMELINE.impact)),
          animationDuration: timing(180),
        })}
      />

      {/* 楔形冲击: 沿斩线法线的两片尖角, 把力的方向明写出来。 */}
      {[0, 180].map((side) => (
        <i
          key={`wedge-${side}`}
          className={s["quick-wedge"]}
          style={asStyle({
            "--wedge-angle": `${BLADE.angle + 90 + side}deg`,
            animationDelay: timing(at(QUICK_TIMELINE.impact)),
            animationDuration: timing(220),
          })}
        />
      ))}

      {/* 冲击环: 沿斩线拉扁的椭圆, 读作「一刀划过去」而非「原地爆炸」。 */}
      <div
        className={s["quick-shock"]}
        style={asStyle({
          width: SHOCK.size,
          height: SHOCK.size,
          "--shock-stretch": SHOCK.stretch,
          "--shock-scale": SHOCK.scale,
          animationDelay: timing(at(QUICK_TIMELINE.impact)),
          animationDuration: timing(280),
        })}
      />

      {SPARKS.map((spark, index) => (
        <span
          key={`spark-${index}`}
          className={s["quick-spark"]}
          data-tone={spark.tone}
          style={asStyle({
            width: spark.length,
            "--spark-angle": `${spark.angle}deg`,
            "--spark-offset": `${spark.offset}px`,
            "--spark-distance": `${spark.distance}px`,
            "--spark-drop": `${spark.drop}px`,
            animationDelay: timing(at(QUICK_TIMELINE.impact + spark.delay)),
            animationDuration: timing(300),
          })}
        />
      ))}

      {DEBRIS.map((debris, index) => (
        <span
          key={`debris-${index}`}
          className={s["quick-debris"]}
          data-tone={debris.tone}
          style={asStyle({
            width: debris.size,
            height: debris.size,
            "--debris-along": `${debris.along}px`,
            "--debris-dx": `${debris.dx}px`,
            "--debris-dy": `${debris.dy}px`,
            "--debris-rot": `${debris.rotate}deg`,
            animationDelay: timing(at(QUICK_TIMELINE.impact + debris.delay)),
            animationDuration: timing(360),
          })}
        />
      ))}
    </div>
  );
}
