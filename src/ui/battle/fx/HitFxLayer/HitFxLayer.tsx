import type { ComponentType, CSSProperties } from "react";
import type { CardAnim } from "@/engine";
import { ANIM, type HitFx, type ProcFxPreset } from "@/ui/battle/animations";
import type { UnitReact } from "@/ui/battle/unitShell";
import { cx } from "@/ui/common/cx";
import { IaiSlashFx } from "@/ui/battle/fx/IaiSlashFx";
import { BladeSlashFx } from "@/ui/battle/fx/BladeSlashFx";
import { TriSlashFx } from "@/ui/battle/fx/TriSlashFx";
import { BloodSlashFx } from "@/ui/battle/fx/BloodSlashFx";
import { NeonCrossFx } from "@/ui/battle/fx/NeonCrossFx";
import { TripleSlashFx } from "@/ui/battle/fx/TripleSlashFx";
import { BasicSlashFx } from "@/ui/battle/fx/BasicSlashFx";
import { KeenEdgeFx } from "@/ui/battle/fx/KeenEdgeFx";
import { ShieldIcon } from "@/ui/common/StatusPips/icons";
import s from "./HitFxLayer.module.css";

// 命中表现的共用件: 敌人(CombatantView)与我方头像栏(AllyBar)都靠这两个导出, 保证两边的
// 特效着色、命中时序、飘字完全一致 —— 只有承载它们的外壳不同(场上立绘 vs 玻璃头像卡)。

// 签名允许返回 null: reduced-motion 下 proc 特效整层不挂载(如 TriSlashFx 的外壳直返 null)。
const PROC_FX: Partial<Record<CardAnim, (p: { preset: ProcFxPreset }) => JSX.Element | null>> = {
  "iai-slash": IaiSlashFx,
  "blade-slash": BladeSlashFx,
  "tri-slash": TriSlashFx,
  "blood-slash": BloodSlashFx,
  "neon-cross": NeonCrossFx,
  "triple-strike": TripleSlashFx,
  "basic-slash": BasicSlashFx,
  "keen-edge": KeenEdgeFx,
};

// 图标特效(与 PROC_FX 平行的分支): 复用 BUFF 图标 SVG(如护盾), 以"虚幻放大"浮现动画播放。
// 由 ANIM[*].icon 标记启用; 与 emoji 互斥 —— icon 存在时优先渲染图标。
const ICON_FX: Partial<Record<CardAnim, ComponentType<{ className?: string }>>> = {
  shield: ShieldIcon,
};

// 由 hit 推出「受击反应 + CSS 变量」, 交给单位外壳挂在根节点上。
// ★ 返回的不再是**类名**而是 UnitReact 词元("hit" / "bless" / null): 两种外壳分属两个组件,
//   Modules 之后本文件的类名根本传不过去。词元经 unitShellAttrs 落成 data-react, 由本文件
//   的 [data-unit][data-react="hit"] 一族规则命中(见 HitFxLayer.module.css 顶部的契约说明)。
//   --vfx-color:  特效主色, 供闪光/冲击环/光晕/飘字着色
//   --vfx-impact: 挂载 → 命中的偏移, 把受击抖动/闪白推迟到程序化特效真正命中那一刻
//                 (emoji 系缺省 0, 行为不变)
//   --vfx-float-delay/--vfx-float-dur: 飘字延迟与时长, 仅居合斩使用(把飘字推迟到
//                 斩击爆发瞬间并压缩时长, 保证在命中特效 hold 卸载前收尾); 其余动画缺省值下
//                 与原行为逐帧等价。
// 攻击 → 受击抖动闪光; 辅助 → 柔和光晕。
export function hitFxVars(hit: HitFx | null): {
  react: UnitReact;
  vars: Record<string, string>;
} {
  const preset = hit ? ANIM[hit.anim] : null;
  if (!preset) return { react: null, vars: {} };
  return {
    react: preset.kind === "attack" ? "hit" : "bless",
    vars: {
      "--vfx-color": preset.color,
      "--vfx-impact": `${preset.proc?.impactMs ?? 0}ms`,
      "--vfx-float-delay": `${preset.proc?.impactMs ?? 0}ms`,
      "--vfx-float-dur": `${preset.proc?.floatMs ?? 950}ms`,
    },
  };
}

// 首击特效(斩击/火爆/柔光…) + 伤害/治疗飘字, 命中时刻挂载。
// key={hit.seq}: 连续命中时强制重挂载以重放动画。
// 特效相对最近的定位祖先(= 单位根节点)定位, 故本组件必须挂在 .combatant 内部。
export function HitFxLayer({ hit }: { hit: HitFx | null }) {
  const preset = hit ? ANIM[hit.anim] : null;
  const proc = preset?.proc;
  const Proc = hit ? PROC_FX[hit.anim] : undefined;
  const Icon = hit && preset?.icon ? ICON_FX[hit.anim] : undefined;

  return (
    <>
      {hit && preset && (
        <div
          className={cx(s["vfx"], s[`vfx-${hit.anim}`], s[`vfx-${preset.kind}`])}
          key={hit.seq}
          aria-hidden
        >
          {Proc && proc ? (
            <Proc preset={proc} />
          ) : Icon ? (
            <span className={s["vfx-icon"]}>
              <Icon />
            </span>
          ) : (
            <span className={s["vfx-emoji"]}>{preset.emoji}</span>
          )}
        </div>
      )}
      {/* 飘字。多段伤害 = 多条, 原地依次弹出(delayMs 见 hitFloats.ts)。
          外层 .float-slot 只负责定位与叠序, 位移动画仍全归 .float-num 的 floatUp ——
          两层分开才不用去改那条被居合斩等特效依赖的关键帧。 */}
      {hit?.floats.map((float, index) => (
        <div key={`f${hit.seq}-${index}`} className={s["float-slot"]}>
          <div
            className={cx(s["float-num"], s[`float-${float.tone}`])}
            style={{ "--vfx-float-stagger": `${float.delayMs}ms` } as CSSProperties}
          >
            {float.text}
          </div>
        </div>
      ))}
    </>
  );
}
