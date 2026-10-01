// ============================================================================
// 瞬斩(swift-slash) —— 基础攻击专用的程序化 CSS 斩击, 总长 420ms。
//
// 三拍, 全靠「快」撑打击感:
//   1. 0~40ms   刀路起点一粒闪光(唯一的预兆);
//   2. 40~110ms 刃光 70ms 一口气划到底, 速度线与残影跟着掠过;
//   3. 110ms    斩线向法线两侧裂成两道 + 十字闪, 火花顺着刀势前冲, 300ms 内收干净。
// 本文件只做「几何表 → DOM + 行内时序」映射; 震屏/顿帧归相机, 不配 screenFx。
// ============================================================================

import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { cssVars, fxAnim, fxAnims } from "@/ui/battle/fx/shared/fxKit";
import { BLADE, SPARKS, SPEED_LINES, SWIFT_TIMELINE } from "./swiftSlashGeometry";
import s from "./SwiftSlashFx.module.css";

const DRAW_MS = SWIFT_TIMELINE.impact - SWIFT_TIMELINE.blade;

export function SwiftSlashFx({ preset }: { preset: ProcFxPreset }) {
  // 整条时间轴按「表里的爆点」与「preset 要求的爆点」之差平移, 掉血/飘字才对得上爆帧。
  const offset = preset.impactMs - SWIFT_TIMELINE.impact;
  const at = (ms: number) => Math.max(0, offset + ms);
  const impact = at(SWIFT_TIMELINE.impact);

  return (
    <div
      className={s.wrap}
      style={cssVars({ "--swift-len": `${BLADE.length}px`, "--swift-angle": `${BLADE.angle}deg` })}
    >
      <i className={s.glint} style={fxAnim(at(SWIFT_TIMELINE.glint), 90)} />

      {SPEED_LINES.map((line, index) => (
        <i
          key={`speed-${index}`}
          className={s.speed}
          style={{
            ...cssVars({ "--speed-offset": `${line.offset}px`, "--speed-len": `${line.length}px` }),
            ...fxAnim(at(SWIFT_TIMELINE.blade + line.delay), 190),
          }}
        />
      ))}

      {/* 残影: 法线方向错开 16px、稍晚 25ms 的半透明第二刀, 制造「快到留影」的读数。 */}
      <i className={s.ghost} style={fxAnims([at(SWIFT_TIMELINE.blade + 25), DRAW_MS], [impact + 20, 200])} />

      {/* 刃光: 辉光 + 白芯。第一段划出, 第二段爆点加粗后收细消散。 */}
      <i className={s.streakGlow} style={fxAnims([at(SWIFT_TIMELINE.blade), DRAW_MS], [impact, 240])} />
      <i className={s.streakCore} style={fxAnims([at(SWIFT_TIMELINE.blade), DRAW_MS], [impact, 220])} />

      {/* 斩线裂开: 两道细线沿法线向两侧张开, 读作「被切开」。 */}
      <i className={s.splitA} style={fxAnim(impact, 280)} />
      <i className={s.splitB} style={fxAnim(impact, 280)} />

      {/* 十字闪 + 白核: 长臂沿刀路, 短臂沿法线, 过冲后急收。 */}
      <i className={s.core} style={fxAnim(impact, 170)} />
      <i className={s.starLong} style={fxAnim(impact, 180)} />
      <i className={s.starShort} style={fxAnim(impact, 150)} />

      {SPARKS.map((spark, index) => (
        <span
          key={`spark-${index}`}
          className={s.spark}
          data-tone={spark.tone}
          style={{
            ...cssVars({
              "--spark-angle": `${spark.angle}deg`,
              "--spark-distance": `${spark.distance}px`,
              "--spark-len": `${spark.length}px`,
            }),
            ...fxAnim(impact + spark.delay, 280),
          }}
        />
      ))}
    </div>
  );
}
