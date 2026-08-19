// ============================================================================
// 墨韵 · 剑意斩 —— ds 专属的**水墨风**程序化斩击特效(纯 CSS 关键帧, 无序列帧素材)。
//
// 与战斗侧 blade-slash(青蓝光刀) / blood-slash(血色刀痕) 刻意拉开风味:
//   ① 蓄意  纸面微光 + 中心墨晕凝聚;
//   ② 横扫  湿墨晕 + 浓墨剑身 + 枯笔飞白, 沿 -42deg 斜上挑斩;
//   ③ 爆墨  纸裂白闪 + 墨环涟漪 + 墨点飞溅 + 朱砂印落款(爆点 = preset.impactMs);
//   ④ 收锋  剑痕墨迹洇开渐干, 飞溅墨点沉定。
// 颜色只三族: 墨(近黑灰) / 纸(暖白) / 朱(印章红)。几何与时间轴全在本文件与
// DsInkSlashFx.module.css 里, 不引用任何 battle 代码 —— test/ds 页签自足。
//
// 时间轴约定: 所有片段以爆墨为锚(preset.impactMs), 相对偏移经 at() 换算成毫秒
// 后由 timing() 除以 --fx-rate(倍速) 下发 —— demo 改倍速只动一个 CSS 变量。
// ============================================================================

import type { CSSProperties } from "react";
import s from "./DsInkSlashFx.module.css";

export interface InkSlashPreset {
  impactMs: number; // 挂载 → 爆墨(纸裂/涟漪/飞溅/朱印)的偏移(ms)
  hold: number; // 特效完整播完(含收锋)所需时长(ms)
}

// demo 默认档位: 爆墨 1400ms, 全长 2600ms(收锋 2550ms 收尾, 留 50ms 余量)。
export const INK_SLASH_PRESET: InkSlashPreset = { impactMs: 1400, hold: 2600 };

const timing = (milliseconds: number) =>
  `calc(${milliseconds}ms / max(var(--fx-rate, 1), 0.25))`;

// 墨点飞溅表: 落点(相对爆点)/大小/出发延迟 —— 烘成固定表, 重播时布局稳定。
const DROPS = [
  { dx: 96, dy: -152, size: 6, delay: 0 },
  { dx: -120, dy: -108, size: 5, delay: 18 },
  { dx: 44, dy: 196, size: 7, delay: 34 },
  { dx: -210, dy: 58, size: 4, delay: 12 },
  { dx: 236, dy: 84, size: 5, delay: 48 },
  { dx: -64, dy: -236, size: 6, delay: 26 },
  { dx: 168, dy: -24, size: 4, delay: 56 },
  { dx: -292, dy: -66, size: 8, delay: 8 },
  { dx: 84, dy: 240, size: 5, delay: 62 },
  { dx: -158, dy: 208, size: 6, delay: 40 },
  { dx: 308, dy: -128, size: 5, delay: 22 },
  { dx: -342, dy: 120, size: 7, delay: 70 },
  { dx: 128, dy: -300, size: 4, delay: 36 },
  { dx: -86, dy: 320, size: 6, delay: 52 },
  { dx: 372, dy: 62, size: 5, delay: 14 },
  { dx: -418, dy: -32, size: 4, delay: 76 },
  { dx: 52, dy: 348, size: 9, delay: 30 },
  { dx: -250, dy: -220, size: 6, delay: 58 },
  { dx: 286, dy: -246, size: 5, delay: 44 },
  { dx: -372, dy: 262, size: 7, delay: 66 },
  { dx: 420, dy: 148, size: 4, delay: 20 },
  { dx: -148, dy: 388, size: 8, delay: 82 },
  { dx: 336, dy: 302, size: 5, delay: 54 },
  { dx: -28, dy: -412, size: 6, delay: 68 },
] as const;

const asStyle = (style: Record<string, string | number>) => style as CSSProperties;

export function DsInkSlashFx({ preset }: { preset: InkSlashPreset }) {
  // 爆墨锚点; at() 把「相对爆墨的偏移」换算成挂载后的毫秒, 负偏移截到 0。
  const impact = Math.max(preset.impactMs, 0);
  const at = (offsetMs: number) => Math.max(0, impact + offsetMs);

  return (
    <div className={s["ink-wrap"]}>
      {/* ① 蓄意: 宣纸微光 + 中心墨晕 */}
      <div
        className={s["ink-paper-glow"]}
        style={{ animationDelay: timing(at(-1400)), animationDuration: timing(640) }}
      />
      <div
        className={s["ink-charge"]}
        style={{ animationDelay: timing(at(-1400)), animationDuration: timing(640) }}
      />
      {/* ② 横扫: 湿墨晕 + 浓墨剑身 + 三道枯笔飞白 */}
      <div
        className={s["ink-blade-wet"]}
        style={{ animationDelay: timing(at(-780)), animationDuration: timing(500) }}
      />
      <div
        className={s["ink-blade-core"]}
        style={{ animationDelay: timing(at(-780)), animationDuration: timing(500) }}
      />
      <div
        className={s["ink-dry"]}
        style={asStyle({
          top: "calc(50% + 16px)",
          width: 260,
          animationDelay: timing(at(-762)),
          animationDuration: timing(460),
        })}
      />
      <div
        className={s["ink-dry"]}
        style={asStyle({
          top: "calc(50% - 12px)",
          width: 210,
          animationDelay: timing(at(-735)),
          animationDuration: timing(430),
        })}
      />
      <div
        className={s["ink-dry"]}
        style={asStyle({
          top: "calc(50% + 30px)",
          width: 240,
          animationDelay: timing(at(-708)),
          animationDuration: timing(400),
        })}
      />
      {/* 横扫后的余韵 + 爆墨前的蓄势 */}
      <div
        className={s["ink-wake"]}
        style={{ animationDelay: timing(at(-280)), animationDuration: timing(480) }}
      />
      <div
        className={s["ink-swell"]}
        style={{ animationDelay: timing(at(-500)), animationDuration: timing(500) }}
      />
      {/* ③ 爆墨: 纸裂柔光 + 纸裂白闪 + 墨环涟漪 + 朱印落款 */}
      <div
        className={s["ink-tear-glow"]}
        style={{ animationDelay: timing(at(0)), animationDuration: timing(340) }}
      />
      <div
        className={s["ink-tear"]}
        style={{ animationDelay: timing(at(0)), animationDuration: timing(340) }}
      />
      <div
        className={s["ink-ripple"]}
        style={{ animationDelay: timing(at(40)), animationDuration: timing(560) }}
      />
      <div
        className={s["ink-seal"]}
        style={{
          animationDelay: `${timing(at(170))}, ${timing(at(400))}`,
          animationDuration: `${timing(200)}, ${timing(520)}`,
        }}
      />
      {/* 墨点飞溅: 先飞出, 落地后洇开沉定 */}
      {DROPS.map((drop, index) => (
        <span
          key={`drop-${index}`}
          className={s["ink-drop"]}
          style={asStyle({
            width: drop.size,
            height: drop.size,
            ["--drop-dx"]: `${drop.dx}px`,
            ["--drop-dy"]: `${drop.dy}px`,
            animationDelay: `${timing(at(drop.delay))}, ${timing(at(drop.delay + 300))}`,
            animationDuration: `${timing(300)}, ${timing(620)}`,
          })}
        />
      ))}
      {/* ④ 收锋: 剑痕画出 → 洇开渐干 */}
      <div
        className={s["ink-scar"]}
        style={{
          animationDelay: `${timing(at(180))}, ${timing(at(650))}`,
          animationDuration: `${timing(160)}, ${timing(500)}`,
        }}
      />
    </div>
  );
}
