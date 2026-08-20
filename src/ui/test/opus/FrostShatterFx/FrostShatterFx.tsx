// ============================================================================
// 霜结·碎冰交叉斩(frost-shatter) —— 程序化 CSS 斩击特效。
//
// 设计逻辑 / 动画逻辑与同目录的 neon-cross 完全同构(同一条七拍时间轴、同一套
// 「几何表 → 纯映射组件 → 陈列台」分层、同样的 --fx-rate 与 impactMs 对齐),
// 差别只在质感:
//   · 配色: 冰蓝 × 淡紫的寒色, 而非霓虹青/品红的电子对撞;
//   · 刀形: 棱角冰棱轮廓 + 霜结纹理, 而非圆润纺锤光带;
//   · 收尾: 实体冰晶崩碎 + 寒气雾, 而非像素方块与色差坏帧。
//
// 时间轴与几何全在 frostShatterGeometry.ts; 本文件只做「表 → DOM + 行内时序」的
// 映射, 不含任何随机与状态。震屏 / 全屏闪按项目分工归相机与 screenFx, 组件内不做。
// ============================================================================

import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import {
  BLADES,
  BLADE_LENGTH,
  FROST_RINGS,
  FROST_TIMELINE,
  ICE_CHUNKS,
  MOTES,
  RIMES,
  SPLINTERS,
} from "./frostShatterGeometry";
import s from "./FrostShatterFx.module.css";

// 与 BladeSlashFx / NeonCrossFx 同源的速率钩子: --fx-rate 变大 = 整体加速。
const timing = (milliseconds: number) =>
  `calc(${milliseconds}ms / max(var(--fx-rate, 1), 0.25))`;

const asStyle = (style: Record<string, string | number>) => style as CSSProperties;

export function FrostShatterFx({ preset }: { preset: ProcFxPreset }) {
  // 整条时间轴按「表里的爆点」与「preset 要求的爆点」之差平移, 掉血/飘字才对得上崩碎帧。
  const offset = preset.impactMs - FROST_TIMELINE.impact;
  const at = (timelineMs: number) => Math.max(0, offset + timelineMs);

  return (
    <div
      className={s["frost-wrap"]}
      style={asStyle({ "--blade-len": `${BLADE_LENGTH}px` })}
    >
      {/* 预警层: 目标区寒气场 + 放射霜纹, 从挂载起就在, 爆点后随余韵散掉。 */}
      <div
        className={s["frost-field"]}
        style={asStyle({
          animationDelay: `${timing(at(FROST_TIMELINE.frostIn))}, ${timing(at(FROST_TIMELINE.impact))}`,
          animationDuration: `${timing(520)}, ${timing(500)}`,
        })}
      />
      {RIMES.map((rime, index) => (
        <span
          key={`rime-${index}`}
          className={s["frost-rime"]}
          style={asStyle({
            width: rime.length,
            height: rime.width,
            "--rime-angle": `${rime.angle}deg`,
            "--rime-opacity": rime.opacity,
            animationDelay: timing(at(FROST_TIMELINE.frostIn + rime.delay)),
            animationDuration: timing(rime.duration),
          })}
        />
      ))}

      {/* 两刀。wrapper 只负责旋转, 内层三条(辉光/刀芯/拖影)各自从左端 scaleX 扫出。 */}
      {BLADES.map((blade, index) => (
        <div
          key={`blade-${index}`}
          className={s["frost-blade"]}
          data-tone={blade.tone}
          style={asStyle({ "--blade-angle": `${blade.angle}deg` })}
        >
          <i
            className={s["frost-blade-glow"]}
            style={asStyle({
              animationDelay: `${timing(at(blade.at - 40))}, ${timing(at(FROST_TIMELINE.impact))}`,
              animationDuration: `${timing(260)}, ${timing(420)}`,
            })}
          />
          <i
            className={s["frost-blade-core"]}
            style={asStyle({
              animationDelay: `${timing(at(blade.at))}, ${timing(at(FROST_TIMELINE.impact))}`,
              animationDuration: `${timing(180)}, ${timing(360)}`,
            })}
          />
          <i
            className={s["frost-blade-ghost"]}
            style={asStyle({
              animationDelay: timing(at(blade.at + 60)),
              animationDuration: timing(420),
            })}
          />
        </div>
      ))}

      {MOTES.map((mote, index) => {
        const blade = BLADES[mote.blade]!;
        return (
          <span
            key={`mote-${index}`}
            className={s["frost-mote"]}
            data-tone={blade.tone}
            style={asStyle({
              width: mote.size,
              height: mote.size,
              "--mote-angle": `${blade.angle}deg`,
              "--mote-along": `${mote.along}px`,
              "--mote-dx": `${mote.dx}px`,
              "--mote-dy": `${mote.dy}px`,
              animationDelay: timing(at(blade.at + mote.delay)),
              animationDuration: timing(340),
            })}
          />
        );
      })}

      {/* 交点冰晶核: 两刀交汇处凝结, 是「这一击的重心」的视觉落点。 */}
      <div
        className={s["frost-core"]}
        style={asStyle({
          animationDelay: `${timing(at(FROST_TIMELINE.core))}, ${timing(at(FROST_TIMELINE.impact))}`,
          animationDuration: `${timing(380)}, ${timing(260)}`,
        })}
      />
      <div
        className={s["frost-core-star"]}
        style={asStyle({
          animationDelay: timing(at(FROST_TIMELINE.core + 40)),
          animationDuration: timing(620),
        })}
      />
      <div
        className={s["frost-core-ring"]}
        style={asStyle({
          animationDelay: timing(at(FROST_TIMELINE.core + 60)),
          animationDuration: timing(520),
        })}
      />

      {/* 结霜脉冲: 冰晶核成形那一帧, 一圈圈寒气错峰向外推。 */}
      {FROST_RINGS.map((pulse, index) => (
        <span
          key={`pulse-${index}`}
          className={s["frost-pulse"]}
          data-tone={pulse.tone}
          style={asStyle({
            borderWidth: pulse.width,
            "--pulse-scale": pulse.scale,
            animationDelay: timing(at(FROST_TIMELINE.core + pulse.delay)),
            animationDuration: timing(560),
          })}
        />
      ))}

      {/* 十字龟裂: 静默段缓缓张开, 爆点被它撑到最开后一起崩掉。 */}
      {BLADES.map((blade, index) => (
        <div
          key={`crack-${index}`}
          className={s["frost-crack"]}
          data-tone={blade.tone}
          style={asStyle({ "--blade-angle": `${blade.angle}deg` })}
        >
          <i
            style={asStyle({
              animationDelay: `${timing(at(FROST_TIMELINE.crack))}, ${timing(at(FROST_TIMELINE.impact))}`,
              animationDuration: `${timing(FROST_TIMELINE.impact - FROST_TIMELINE.crack)}, ${timing(340)}`,
            })}
          />
        </div>
      ))}

      {/* 爆点三件套: 冲击环 + 冰晶碎块崩解 + 冰针四散。 */}
      <div
        className={s["frost-shock"]}
        style={asStyle({
          animationDelay: timing(at(FROST_TIMELINE.impact)),
          animationDuration: timing(460),
        })}
      />
      {ICE_CHUNKS.map((chunk, index) => (
        <span
          key={`chunk-${index}`}
          className={s["frost-chunk"]}
          data-tone={chunk.tone}
          data-shape={chunk.shape}
          style={asStyle({
            left: `calc(50% + ${chunk.x}px)`,
            top: `calc(50% + ${chunk.y}px)`,
            width: chunk.size,
            height: chunk.size,
            "--chunk-dx": `${chunk.dx}px`,
            "--chunk-dy": `${chunk.dy}px`,
            "--chunk-rot": `${chunk.rotate}deg`,
            animationDelay: timing(at(FROST_TIMELINE.impact + chunk.delay)),
            animationDuration: timing(560),
          })}
        />
      ))}
      {SPLINTERS.map((splinter, index) => (
        <span
          key={`splinter-${index}`}
          className={s["frost-splinter"]}
          data-tone={splinter.tone}
          style={asStyle({
            width: splinter.length,
            "--splinter-angle": `${splinter.angle}deg`,
            "--splinter-offset": `${splinter.offset}px`,
            "--splinter-distance": `${splinter.distance}px`,
            animationDelay: timing(at(FROST_TIMELINE.impact + splinter.delay)),
            animationDuration: timing(500),
          })}
        />
      ))}

      {/* 收尾: 爆点后浮起一层寒气雾, 慢慢化掉(对应 neon 的扫描线消散)。 */}
      <div
        className={s["frost-mist"]}
        style={asStyle({
          animationDelay: timing(at(FROST_TIMELINE.impact + 60)),
          animationDuration: timing(FROST_TIMELINE.total - FROST_TIMELINE.impact + 260),
        })}
      />
    </div>
  );
}
