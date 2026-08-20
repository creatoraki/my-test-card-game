// ============================================================================
// 流光·三段斩(triple-strike) —— 程序化 CSS 斩击特效(ds 专属, 纯 CSS 关键帧)。
//
// 动画设计理念与霓虹数据·交叉斩(opus/NeonCrossFx)相同:
//   · 时间轴节奏一致: 起手 → 斩击段 → 静默蓄压 → 爆点 → 收尾;
//   · 同一套契约: preset.impactMs 锚爆点、--fx-rate 整体倍速、纯表→DOM 映射;
//   · 震屏 / 全屏闪按项目分工归相机与 screenFx, 组件内不做。
//
// 但动作设计完全不同 —— 霓虹是「双刀交叉」的张开构图, 三段斩是「乱舞连斩」
// 的爆发构图:
//   · 起手一刀沿 38° 快速劈出并悬停(顿住的一瞬是危险, 不是预兆);
//   · 六道不同轨迹的斩击在 180ms 内爆发, 角度跨 200° 乱舞, 扫完即灭;
//   · 六连斩完目标上留下六道斩痕, 静默渗光蓄压, 爆点六芒冲击 + 碎片沿六向飞散。
//
// 时间轴与几何全在 tripleSlashGeometry.ts; 本文件只做「表 → DOM + 行内时序」
// 的映射, 不含任何随机与状态。
// ============================================================================

import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import {
  ASHES,
  BLADE_LENGTH,
  FRAGMENTS,
  MANTLES,
  SCARS,
  SLASHES,
  SPARKS,
  SPLINTERS,
  TRIPLE_TIMELINE,
} from "./tripleSlashGeometry";
import s from "./TripleSlashFx.module.css";

// 与 NeonCrossFx 同源的速率钩子: --fx-rate 变大 = 整体加速。
const timing = (milliseconds: number) =>
  `calc(${milliseconds}ms / max(var(--fx-rate, 1), 0.25))`;

const asStyle = (style: Record<string, string | number>) => style as CSSProperties;

export function DsTripleSlashFx({ preset }: { preset: ProcFxPreset }) {
  // 整条时间轴按「表里的爆点」与「preset 要求的爆点」之差平移, 掉血/飘字才对得上爆裂帧。
  const offset = preset.impactMs - TRIPLE_TIMELINE.impact;
  const at = (timelineMs: number) => Math.max(0, offset + timelineMs);

  return (
    <div
      className={s["triple-wrap"]}
      style={asStyle({ "--blade-len": `${BLADE_LENGTH}px` })}
    >
      {/* 斩击段: 起手一刀(粗、慢、扫完悬停再淡出) + 六连快刀(细、快、扫完即灭)。
          wrapper 只负责旋转, 内层三条各自从左端 scaleX 扫出。 */}
      {SLASHES.map((blade, index) => (
        <div
          key={`blade-${index}`}
          className={s["triple-blade"]}
          data-tone={blade.tone}
          style={asStyle({
            "--blade-angle": `${blade.angle}deg`,
            "--blade-glow-h": `${blade.glowHeight}px`,
            "--blade-core-h": `${blade.coreHeight}px`,
            "--blade-trail-h": `${blade.trailHeight}px`,
          })}
        >
          <i
            className={blade.kind === "opener" ? s["triple-blade-glow"] : s["triple-blade-flurry-glow"]}
            style={asStyle({
              // 起手刀三拍: 扫出 → 悬停脉动 → 六连起手时淡出(被乱舞吞没);
              // 六连刀一拍: 快扫即灭。
              animationDelay:
                blade.kind === "opener"
                  ? `${timing(at(blade.at - 30))}, ${timing(at(TRIPLE_TIMELINE.hold))}, ${timing(at(TRIPLE_TIMELINE.flurry))}`
                  : timing(at(blade.at)),
              animationDuration:
                blade.kind === "opener"
                  ? `${timing(blade.sweepMs + 30)}, ${timing(TRIPLE_TIMELINE.flurry - TRIPLE_TIMELINE.hold)}, ${timing(120)}`
                  : timing(90),
            })}
          />
          <i
            className={blade.kind === "opener" ? s["triple-blade-core"] : s["triple-blade-flurry-core"]}
            style={asStyle({
              animationDelay:
                blade.kind === "opener"
                  ? `${timing(at(blade.at))}, ${timing(at(TRIPLE_TIMELINE.hold))}, ${timing(at(TRIPLE_TIMELINE.flurry))}`
                  : timing(at(blade.at)),
              animationDuration:
                blade.kind === "opener"
                  ? `${timing(blade.sweepMs)}, ${timing(TRIPLE_TIMELINE.flurry - TRIPLE_TIMELINE.hold)}, ${timing(110)}`
                  : timing(90),
            })}
          />
          {blade.kind === "opener" && (
            <i
              className={s["triple-blade-trail"]}
              style={asStyle({
                animationDelay: timing(at(blade.at + 40)),
                animationDuration: timing(200),
              })}
            />
          )}
        </div>
      ))}

      {SPARKS.map((spark, index) => {
        const blade = SLASHES[spark.blade]!;
        return (
          <span
            key={`spark-${index}`}
            className={s["triple-spark"]}
            data-tone={spark.tone}
            style={asStyle({
              width: spark.size,
              height: spark.size,
              "--spark-angle": `${blade.angle}deg`,
              "--spark-along": `${spark.along}px`,
              "--spark-dx": `${spark.dx}px`,
              "--spark-dy": `${spark.dy}px`,
              animationDelay: timing(at(blade.at + spark.delay)),
              animationDuration: timing(320),
            })}
          />
        );
      })}

      {/* 斩痕: 六连在目标上留下的灼痕, 静默段依次渗光加深, 爆点一起炸亮后熄灭。
          毛刺从斩痕两侧伸出, 让刀口有「撕裂」的毛边。 */}
      {SCARS.map((scar, index) => {
        const blade = SLASHES[scar.blade]!;
        return (
          <div
            key={`scar-${index}`}
            className={s["triple-scar"]}
            style={asStyle({ "--blade-angle": `${blade.angle}deg` })}
          >
            <i
              style={asStyle({
                width: scar.length,
                animationDelay: `${timing(at(TRIPLE_TIMELINE.scars + scar.delay))}, ${timing(at(TRIPLE_TIMELINE.impact))}`,
                animationDuration: `${timing(TRIPLE_TIMELINE.impact - TRIPLE_TIMELINE.scars - scar.delay)}, ${timing(340)}`,
              })}
            />
          </div>
        );
      })}
      {SPLINTERS.map((splinter, index) => {
        const blade = SLASHES[splinter.blade]!;
        return (
          <span
            key={`splinter-${index}`}
            className={s["triple-splinter"]}
            style={asStyle({
              "--sp-angle": `${blade.angle}deg`,
              "--sp-along": `${splinter.along}px`,
              "--sp-side": `${splinter.side * 90}deg`,
              "--sp-len": `${splinter.length}px`,
              animationDelay: `${timing(at(TRIPLE_TIMELINE.scars + splinter.delay))}, ${timing(at(TRIPLE_TIMELINE.impact))}`,
              animationDuration: `${timing(150)}, ${timing(280)}`,
            })}
          />
        );
      })}

      {/* 爆点: 六芒沿六连方向射出 + 圆形冲击环 + 碎片沿六向锥形四散 + 余烬沉降。 */}
      {MANTLES.map((mantle, index) => {
        const blade = SLASHES[mantle.blade]!;
        return (
          <div
            key={`mantle-${index}`}
            className={s["triple-mantle"]}
            style={asStyle({ "--blade-angle": `${blade.angle}deg` })}
          >
            <i
              style={asStyle({
                width: mantle.distance,
                height: mantle.width,
                animationDelay: timing(at(TRIPLE_TIMELINE.impact)),
                animationDuration: timing(420),
              })}
            />
          </div>
        );
      })}
      <div
        className={s["triple-shock"]}
        style={asStyle({
          animationDelay: timing(at(TRIPLE_TIMELINE.impact)),
          animationDuration: timing(460),
        })}
      />
      {FRAGMENTS.map((fragment, index) => (
        <span
          key={`fragment-${index}`}
          className={s["triple-fragment"]}
          data-tone={fragment.tone}
          style={asStyle({
            width: fragment.length,
            "--fr-angle": `${fragment.angle}deg`,
            "--fr-offset": `${fragment.offset}px`,
            "--fr-distance": `${fragment.distance}px`,
            animationDelay: timing(at(TRIPLE_TIMELINE.impact + fragment.delay)),
            animationDuration: timing(500),
          })}
        />
      ))}
      {ASHES.map((ash, index) => (
        <span
          key={`ash-${index}`}
          className={s["triple-ash"]}
          style={asStyle({
            width: ash.size,
            height: ash.size,
            "--ash-dx": `${ash.dx}px`,
            "--ash-dy": `${ash.dy}px`,
            animationDelay: timing(at(TRIPLE_TIMELINE.impact + ash.delay)),
            animationDuration: timing(560),
          })}
        />
      ))}
    </div>
  );
}
