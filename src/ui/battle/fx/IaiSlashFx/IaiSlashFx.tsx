import type { ProcFxPreset } from "@/ui/battle/animations";
import s from "./IaiSlashFx.module.css";

// 居合拔刀斩(程序化 CSS)首击特效: 蓄力光点 + 左下→右上的斩痕刃光。
// 与 SpriteFx 同模式 —— 组件零状态, 挂载即播、卸载即停, key={hit.seq} 重挂载即重播;
// 全部时序由 CSS 动画驱动, 爆发时刻通过行内 animation-delay 与预设 impactMs 硬同步。
// 几何: 外层 .iai-wrap 旋转 -45° ⇒ 容器局部 X 轴即"左下→右上"对角线, 刃光/光点
// 只需沿局部 X 轴布置(见 IaiSlashFx.css 的 iai 系样式)。

// 光点固定伪随机分布表: t=沿刃向偏移(px), n=垂直刃向微偏(px), size=直径(px),
// delay=渐亮错峰(ms)。不真随机 —— 可复现且免 re-render 抖动。
const DOTS = [
  { t: -64, n: 6, size: 5, delay: 40 },
  { t: -38, n: -8, size: 4, delay: 140 },
  { t: -12, n: 10, size: 6, delay: 90 },
  { t: 14, n: -5, size: 4, delay: 200 },
  { t: 40, n: 7, size: 5, delay: 20 },
  { t: 62, n: -9, size: 4, delay: 170 },
  { t: 0, n: 0, size: 7, delay: 260 }, // 中心主光点最后亮起 = 蓄力顶点
] as const;

export function IaiSlashFx({ preset }: { preset: ProcFxPreset }) {
  return (
    <div className={s["iai-wrap"]}>
      <div className={s["iai-glow"]} />
      <div className={s["iai-blade"]} />
      {DOTS.map((d, i) => (
        <span
          key={i}
          className={s["iai-dot"]}
          style={{
            left: `calc(50% + ${d.t}px)`,
            top: `calc(50% + ${d.n}px)`,
            width: d.size,
            height: d.size,
            // 两段动画(蓄力渐亮 + 爆闪消散)的 animation-name 写在 IaiSlashFx.module.css ——
            // 关键帧名会被 Modules 哈希, 行内字符串匹配不到。这里只下发时序。
            animationDelay: `calc(${d.delay}ms / max(var(--fx-rate, 1), 0.25)), calc(${preset.impactMs}ms / max(var(--fx-rate, 1), 0.25))`,
            animationDuration: `calc(${preset.impactMs - d.delay}ms / max(var(--fx-rate, 1), 0.25)), calc(240ms / max(var(--fx-rate, 1), 0.25))`,
          }}
        />
      ))}
    </div>
  );
}
