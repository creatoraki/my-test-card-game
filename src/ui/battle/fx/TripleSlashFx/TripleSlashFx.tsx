// ============================================================================
// 流光·三段斩(triple-strike) —— 程序化 CSS 斩击特效(ds 专属, 纯 CSS 关键帧)。
// 本副本是战斗正式件, test/ds 下的同名副本是 demo 陈列用, 两者已分家。
//
// 动画设计理念与霓虹数据·交叉斩(opus/NeonCrossFx)相同:
//   · 时间轴节奏一致: 起手 → 斩击段 → 静默蓄压 → 爆点 → 收尾;
//   · 同一套契约: preset.impactMs 锚爆点、--fx-rate 整体倍速、纯表→DOM 映射;
//   · 震屏 / 全屏闪按项目分工归相机与 screenFx, 组件内不做。
//
// 但动作设计完全不同 —— 霓虹是「双刀交叉」的张开构图, 三段斩是「乱舞连斩」
// 的爆发构图:
//   · 起手一刀沿 38° 快速劈出并悬停(顿住的一瞬是危险, 不是预兆);
//   · 悬停尾段是一整段转场演出, 不是切镜: 压刀蓄力(wind) → 首刀原地崩断成
//     五段、各段垂直于刀身弹开(shatter) + 扇向六连角度的残影 + 光环由外向内
//     塌缩收拢视线 → 中心出鞘白闪(ignite)先炸开、六连第一刀随后从白闪里劈出;
//   · 六道不同轨迹的斩击逐刀爆发, 角度跨 200° 乱舞, 扫完即灭;
//   · 六连斩完目标上留下六道斩痕, 静默渗光蓄压, 爆点六芒冲击 + 碎片沿六向飞散。
//
// 时间轴与几何全在 tripleSlashGeometry.ts; 本文件只做「表 → DOM + 行内时序」
// 的映射, 不含任何随机与状态。
// ============================================================================

import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import {
  AFTERIMAGES,
  ASHES,
  BLADE_LENGTH,
  FRAGMENTS,
  MANTLES,
  OPENER_SHARDS,
  SHATTER_SPARKS,
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

/** 崩断时长(ms): 本体只闪这一下就交棒给碎段, 短才像「裂」而不像「淡出」。 */
const SHATTER_MS = 60;

/** 收束环时长(ms): 崩断后 200ms 内急速塌缩收拢视线, 然后**留白屏息**一段
    (白闪 850ms 才炸) —— 环是「收」的指令, 收完就消失, 不跟白闪抢拍。 */
const GATHER_MS = 200;

/** 出鞘白闪时长(ms): 收束环塌完、留白屏息后的那一瞬骤亮 —— 稍微留足一点,
    观众才读得到「白闪引路、六连随后」的顺序, 太短会闪成噪点。 */
const IGNITE_MS = 50;

// 起手刀四拍(扫出 / 悬停 / 压刀蓄力 / 崩断)的时序。辉光与刀芯跑的是不同的
// 关键帧(模糊量不同), 但拍点必须逐毫秒一致, 所以时序在这里写一次。
const openerDelays = (at: (timelineMs: number) => number) =>
  [TRIPLE_TIMELINE.opener, TRIPLE_TIMELINE.hold, TRIPLE_TIMELINE.wind, TRIPLE_TIMELINE.shatter]
    .map((beat) => timing(at(beat)))
    .join(", ");

const openerDurations = (sweepMs: number) =>
  [
    sweepMs,
    TRIPLE_TIMELINE.wind - TRIPLE_TIMELINE.hold,
    TRIPLE_TIMELINE.shatter - TRIPLE_TIMELINE.wind,
    SHATTER_MS,
  ]
    .map((duration) => timing(duration))
    .join(", ");

export function TripleSlashFx({ preset }: { preset: ProcFxPreset }) {
  // 整条时间轴按「表里的爆点」与「preset 要求的爆点」之差平移, 掉血/飘字才对得上爆裂帧。
  const offset = preset.impactMs - TRIPLE_TIMELINE.impact;
  const at = (timelineMs: number) => Math.max(0, offset + timelineMs);
  // 碎段、残影、崩断火花都长在首刀那条线上, 角度只认表里的首刀, 不硬编。
  const opener = SLASHES[0]!;

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
              // 起手刀四拍: 扫出 → 悬停脉动 → 压刀蓄力 → 崩断;
              // 六连刀两拍: 扫出(快出) → 消散(平滑渐隐 + 前滑余势)。
              animationDelay:
                blade.kind === "opener"
                  ? openerDelays(at)
                  : `${timing(at(blade.at))}, ${timing(at(blade.at + blade.sweepMs))}`,
              animationDuration:
                blade.kind === "opener"
                  ? openerDurations(blade.sweepMs)
                  : `${timing(blade.sweepMs)}, ${timing(blade.fadeMs)}`,
            })}
          />
          <i
            className={blade.kind === "opener" ? s["triple-blade-core"] : s["triple-blade-flurry-core"]}
            style={asStyle({
              animationDelay:
                blade.kind === "opener"
                  ? openerDelays(at)
                  : `${timing(at(blade.at))}, ${timing(at(blade.at + blade.sweepMs))}`,
              animationDuration:
                blade.kind === "opener"
                  ? openerDurations(blade.sweepMs)
                  : `${timing(blade.sweepMs)}, ${timing(blade.fadeMs)}`,
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

      {/* 转场段(首刀退场 → 六连爆发): 碎段崩飞 + 残影扇开 + 崩断火花 + 收束环 +
           出鞘白闪。这一段不动任何后续锚点, 全部塞在原本空着的悬停尾段里。
           节奏: 460ms 崩断 → 碎段/残影/火花一路散到 ~870ms(六连起手前才散尽),
           收束环 470-670ms 急速塌缩收视线, 670-850ms 留白屏息, 850ms 白闪引路,
           880ms 六连第一刀从白闪里劈出 —— 转场是「散场 + 屏息」, 不是「换台」。 */}
      {OPENER_SHARDS.map((shard, index) => (
        <span
          key={`shard-${index}`}
          className={s["triple-shard"]}
          style={asStyle({
            "--shard-angle": `${opener.angle}deg`,
            "--shard-along": `${shard.along}px`,
            "--shard-len": `${shard.length}px`,
            "--shard-h": `${shard.height}px`,
            // push 带上 side 的符号: 正负决定往刀身的哪一侧弹。
            "--shard-push": `${shard.push * shard.side}px`,
            "--shard-spin": `${shard.spin}deg`,
            animationDelay: timing(at(TRIPLE_TIMELINE.shatter + shard.delay)),
            animationDuration: timing(shard.fadeMs),
          })}
        />
      ))}
      {AFTERIMAGES.map((ghost, index) => (
        <div
          key={`ghost-${index}`}
          className={s["triple-ghost"]}
          style={asStyle({
            "--ghost-from": `${opener.angle}deg`,
            "--ghost-to": `${ghost.toAngle}deg`,
            "--ghost-op": ghost.opacity,
            animationDelay: timing(at(TRIPLE_TIMELINE.shatter + ghost.delay)),
            animationDuration: timing(ghost.fadeMs),
          })}
        >
          <i
            style={asStyle({
              animationDelay: timing(at(TRIPLE_TIMELINE.shatter + ghost.delay)),
              animationDuration: timing(ghost.fadeMs),
            })}
          />
        </div>
      ))}
      {SHATTER_SPARKS.map((spark, index) => (
        <span
          key={`shatter-spark-${index}`}
          className={s["triple-spark"]}
          data-tone={spark.tone}
          style={asStyle({
            width: spark.size,
            height: spark.size,
            "--spark-angle": `${opener.angle}deg`,
            "--spark-along": `${spark.along}px`,
            "--spark-dx": `${spark.dx}px`,
            "--spark-dy": `${spark.dy}px`,
            animationDelay: timing(at(TRIPLE_TIMELINE.shatter + spark.delay)),
            animationDuration: timing(300),
          })}
        />
      ))}
      <div
        className={s["triple-gather"]}
        style={asStyle({
          animationDelay: timing(at(TRIPLE_TIMELINE.shatter + 10)),
          animationDuration: timing(GATHER_MS),
        })}
      />
      <div
        className={s["triple-ignite"]}
        style={asStyle({
          animationDelay: timing(at(TRIPLE_TIMELINE.ignite)),
          animationDuration: timing(IGNITE_MS),
        })}
      />

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
