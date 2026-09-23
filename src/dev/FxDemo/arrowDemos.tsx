import type { ReactNode } from "react";
import { ANIM } from "@/ui/battle/choreo/animations";
import { BladeSlashFx } from "@/ui/battle/fx/BladeSlashFx";
import { SunPierceArrowFx, SUN_PIERCE } from "@/ui/battle/fx/SunPierceArrowFx";
import { MeteorRainFx, METEOR_RAIN } from "@/ui/battle/fx/MeteorRainFx";
import { ThunderStakeFx, THUNDER_STAKE } from "@/ui/battle/fx/ThunderStakeFx";

/** 演示页的统一条目: 文案 + 时序 + 渲染函数。CSS 类特效自行读取舞台下发的 --fx-rate。 */
export interface DemoFx {
  id: string;
  name: string;
  category: string;
  description: string;
  /** 分拍说明: [未缩放时刻(ms), 文案]。 */
  beats: readonly (readonly [number, string])[];
  color: string;
  impactMs: number;
  durationMs: number;
  render: () => ReactNode;
}

const blade = ANIM["blade-slash"];

export const ARROW_DEMOS: readonly DemoFx[] = [
  {
    id: "sun-pierce",
    name: "贯日矢",
    category: "弓箭 · 单发穿透",
    description: "瞄准线横贯、锁定圈收拢，弓位蓄满金光后一箭离弦，沿途炸开音障环，贯穿目标时喷出金色锥形光流。",
    beats: [
      [0, "瞄准线展开，锁定圈收拢"],
      [180, "弓位蓄光，光尘回流"],
      [640, "离弦，音障环沿途炸开"],
      [760, "贯穿爆点"],
    ],
    color: SUN_PIERCE.color,
    impactMs: SUN_PIERCE.preset.impactMs,
    durationMs: SUN_PIERCE.holdMs,
    render: () => <SunPierceArrowFx preset={SUN_PIERCE.preset} />,
  },
  {
    id: "meteor-rain",
    name: "流星箭雨",
    category: "弓箭 · 天降范围",
    description: "地面法阵锁定落区，十四支光箭从天而降逐支钉地；光柱收束成一线后巨箭坠击，钉地的箭由内向外连锁引爆。",
    beats: [
      [0, "法阵展开"],
      [240, "箭雨连落"],
      [880, "光柱收束"],
      [1300, "巨箭坠击，连锁引爆"],
    ],
    color: METEOR_RAIN.color,
    impactMs: METEOR_RAIN.preset.impactMs,
    durationMs: METEOR_RAIN.holdMs,
    render: () => <MeteorRainFx preset={METEOR_RAIN.preset} />,
  },
  {
    id: "thunder-stake",
    name: "雷殛钉矢",
    category: "弓箭 · 钉入引爆",
    description: "紫电箭钉入目标后震颤不止，符环展开、电弧乱窜、脉冲环三次加速收束；符环内塌的瞬间引爆，八道落雷向外劈开。",
    beats: [
      [0, "弓位聚电"],
      [440, "钉入目标"],
      [480, "符环蓄压，电弧渐密"],
      [1200, "内塌引爆，落雷四散"],
    ],
    color: THUNDER_STAKE.color,
    impactMs: THUNDER_STAKE.preset.impactMs,
    durationMs: THUNDER_STAKE.holdMs,
    render: () => <ThunderStakeFx preset={THUNDER_STAKE.preset} />,
  },
  {
    id: "blade-reference",
    name: "刀光斩对照",
    category: "原版对照",
    description: "已上线的刀光斩：斜向刀光、粒子回流、沿刃爆裂。用来对照这批弓箭特效的质感与节奏。",
    beats: [
      [0, "刀光斜贯"],
      [420, "粒子回流"],
      [950, "沿刃爆裂"],
    ],
    color: blade.color,
    impactMs: blade.proc!.impactMs,
    durationMs: blade.hold,
    render: () => <BladeSlashFx preset={blade.proc!} />,
  },
];
