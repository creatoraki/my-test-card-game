// ============================================================================
// 霓虹数据·交叉斩(neon-cross) —— 程序化 CSS 斩击特效。
//
// 与现有两款斩击的区分点(三条都刻意拉开, 免得同屏时糊成一片):
//   · 构图: blade-slash 单斜线聚能、blood-slash 单刀下劈, 本效是**双刀交叉**;
//   · 配色: 青蓝 × 品红的霓虹对撞, 而非青白 / 血红的单色系;
//   · 质感: 收尾不是实体碎片, 而是**数码故障** —— 色差错位、扫描线、像素块崩解。
//
// 时间轴与几何全在 neonCrossGeometry.ts; 本文件只做「表 → DOM + 行内时序」的映射,
// 不含任何随机与状态。震屏 / 全屏闪按项目分工归相机与 screenFx, 组件内不做。
// ============================================================================

import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import {
  BLADES,
  BLADE_LENGTH,
  GLITCH_BARS,
  NEON_TIMELINE,
  PIXELS,
  SCANLINES,
  SHARDS,
  SPARKS,
} from "./neonCrossGeometry";
import s from "./NeonCrossFx.module.css";

// 与 BladeSlashFx / BloodSlashFx 同源的速率钩子: --fx-rate 变大 = 整体加速。
const timing = (milliseconds: number) =>
  `calc(${milliseconds}ms / max(var(--fx-rate, 1), 0.25))`;

const asStyle = (style: Record<string, string | number>) => style as CSSProperties;

export function NeonCrossFx({ preset }: { preset: ProcFxPreset }) {
  // 整条时间轴按「表里的爆点」与「preset 要求的爆点」之差平移, 掉血/飘字才对得上爆裂帧。
  const offset = preset.impactMs - NEON_TIMELINE.impact;
  const at = (timelineMs: number) => Math.max(0, offset + timelineMs);

  return (
    <div
      className={s["neon-wrap"]}
      style={asStyle({ "--blade-len": `${BLADE_LENGTH}px` })}
    >
      {/* 预警层: 目标区底光 + 扫描线, 从挂载起就在, 爆点后随余韵散掉。 */}
      <div
        className={s["neon-field"]}
        style={asStyle({
          animationDelay: `${timing(at(NEON_TIMELINE.scanIn))}, ${timing(at(NEON_TIMELINE.impact))}`,
          animationDuration: `${timing(520)}, ${timing(500)}`,
        })}
      />
      {SCANLINES.map((line, index) => (
        <span
          key={`scan-${index}`}
          className={s["neon-scan"]}
          style={asStyle({
            top: `calc(50% + ${line.y}px)`,
            width: line.width,
            "--scan-opacity": line.opacity,
            animationDelay: timing(at(NEON_TIMELINE.scanIn + line.delay)),
            animationDuration: timing(line.duration),
          })}
        />
      ))}

      {/* 两刀。wrapper 只负责旋转, 内层三条(辉光/刀芯/拖影)各自从左端 scaleX 扫出。 */}
      {BLADES.map((blade, index) => (
        <div
          key={`blade-${index}`}
          className={s["neon-blade"]}
          data-tone={blade.tone}
          style={asStyle({ "--blade-angle": `${blade.angle}deg` })}
        >
          <i
            className={s["neon-blade-glow"]}
            style={asStyle({
              animationDelay: `${timing(at(blade.at - 40))}, ${timing(at(NEON_TIMELINE.impact))}`,
              animationDuration: `${timing(260)}, ${timing(420)}`,
            })}
          />
          <i
            className={s["neon-blade-core"]}
            style={asStyle({
              animationDelay: `${timing(at(blade.at))}, ${timing(at(NEON_TIMELINE.impact))}`,
              animationDuration: `${timing(180)}, ${timing(360)}`,
            })}
          />
          <i
            className={s["neon-blade-ghost"]}
            style={asStyle({
              animationDelay: timing(at(blade.at + 60)),
              animationDuration: timing(420),
            })}
          />
        </div>
      ))}

      {SPARKS.map((spark, index) => {
        const blade = BLADES[spark.blade]!;
        return (
          <span
            key={`spark-${index}`}
            className={s["neon-spark"]}
            data-tone={blade.tone}
            style={asStyle({
              width: spark.size,
              height: spark.size,
              "--spark-angle": `${blade.angle}deg`,
              "--spark-along": `${spark.along}px`,
              "--spark-dx": `${spark.dx}px`,
              "--spark-dy": `${spark.dy}px`,
              animationDelay: timing(at(blade.at + spark.delay)),
              animationDuration: timing(340),
            })}
          />
        );
      })}

      {/* 交点白核: 两刀交汇处凝聚, 是「这一击的重心」的视觉落点。 */}
      <div
        className={s["neon-core"]}
        style={asStyle({
          animationDelay: `${timing(at(NEON_TIMELINE.core))}, ${timing(at(NEON_TIMELINE.impact))}`,
          animationDuration: `${timing(380)}, ${timing(260)}`,
        })}
      />
      <div
        className={s["neon-core-ring"]}
        style={asStyle({
          animationDelay: timing(at(NEON_TIMELINE.core + 60)),
          animationDuration: timing(520),
        })}
      />

      {/* 色差错位: 白核成形那一帧, 整块图层被撕成几条横向坏帧。 */}
      {GLITCH_BARS.map((bar, index) => (
        <span
          key={`glitch-${index}`}
          className={s["neon-glitch"]}
          style={asStyle({
            top: `calc(50% + ${bar.y}px)`,
            height: bar.height,
            "--glitch-dx": `${bar.dx}px`,
            animationDelay: timing(at(NEON_TIMELINE.core + bar.delay)),
            animationDuration: timing(220),
          })}
        />
      ))}

      {/* 十字裂痕: 静默段缓缓张开, 爆点被它撑到最开后一起崩掉。 */}
      {BLADES.map((blade, index) => (
        <div
          key={`crack-${index}`}
          className={s["neon-crack"]}
          data-tone={blade.tone}
          style={asStyle({ "--blade-angle": `${blade.angle}deg` })}
        >
          <i
            style={asStyle({
              animationDelay: `${timing(at(NEON_TIMELINE.crack))}, ${timing(at(NEON_TIMELINE.impact))}`,
              animationDuration: `${timing(NEON_TIMELINE.impact - NEON_TIMELINE.crack)}, ${timing(340)}`,
            })}
          />
        </div>
      ))}

      {/* 爆点三件套: 冲击环 + 像素块崩解 + 数据碎片。 */}
      <div
        className={s["neon-shock"]}
        style={asStyle({
          animationDelay: timing(at(NEON_TIMELINE.impact)),
          animationDuration: timing(460),
        })}
      />
      {PIXELS.map((pixel, index) => (
        <span
          key={`pixel-${index}`}
          className={s["neon-pixel"]}
          data-tone={pixel.tone}
          style={asStyle({
            left: `calc(50% + ${pixel.x}px)`,
            top: `calc(50% + ${pixel.y}px)`,
            width: pixel.size,
            height: pixel.size,
            "--pixel-dx": `${pixel.dx}px`,
            "--pixel-dy": `${pixel.dy}px`,
            "--pixel-rot": `${pixel.rotate}deg`,
            animationDelay: timing(at(NEON_TIMELINE.impact + pixel.delay)),
            animationDuration: timing(560),
          })}
        />
      ))}
      {SHARDS.map((shard, index) => (
        <span
          key={`shard-${index}`}
          className={s["neon-shard"]}
          data-tone={shard.tone}
          style={asStyle({
            width: shard.length,
            "--shard-angle": `${shard.angle}deg`,
            "--shard-offset": `${shard.offset}px`,
            "--shard-distance": `${shard.distance}px`,
            animationDelay: timing(at(NEON_TIMELINE.impact + shard.delay)),
            animationDuration: timing(500),
          })}
        />
      ))}
    </div>
  );
}
