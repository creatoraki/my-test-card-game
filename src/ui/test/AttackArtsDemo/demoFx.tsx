import type { ReactNode } from "react";
import type { CardAnim } from "@/engine";
import { AttackArtsFx, ATTACK_ARTS, type AttackArt } from "@/ui/battle/fx/AttackArtsFx";
import { BladeSlashFx } from "@/ui/battle/fx/BladeSlashFx";
import { LunarRingFx } from "@/ui/battle/fx/LunarRingFx";
import { SakuraFlurryFx } from "@/ui/battle/fx/SakuraFlurryFx";
import { GaleCrescentFx, GALE_CRESCENT } from "@/ui/battle/fx/GaleCrescentFx";
import { ANIM, type ProcFxPreset } from "@/ui/battle/animations";

/** 演示页的统一条目: 文案 + 时序 + 渲染函数。rate 仅供画布类特效显式使用, CSS 类特效读 --fx-rate。 */
export interface DemoFx {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  impactMs: number;
  durationMs: number;
  render: (rate: number) => ReactNode;
}

type Copy = Pick<DemoFx, "id" | "name" | "category" | "description">;

const artDemo = (art: AttackArt): DemoFx => ({
  ...art,
  render: (rate) => <AttackArtsFx art={art} rate={rate} />,
});

/** 已接入战斗的程序化特效: 时序与主色直接取 ANIM, 演示与实战同源。 */
function procDemo(anim: CardAnim, copy: Copy, Fx: (p: { preset: ProcFxPreset }) => JSX.Element): DemoFx {
  const preset = ANIM[anim];
  const proc = preset.proc!;
  return {
    ...copy,
    color: preset.color,
    impactMs: proc.impactMs,
    durationMs: preset.hold,
    render: () => <Fx preset={proc} />,
  };
}

export const SLASH_DEMOS: readonly DemoFx[] = [
  procDemo("blade-slash", {
    id: "blade-reference",
    name: "刀光斩对照",
    category: "原版对照",
    description: "原版刀光斩：斜向刀光、粒子回流、沿刃爆裂。作为这批特效的视觉对照。",
  }, BladeSlashFx),
  procDemo("lunar-ring", {
    id: "lunar-ring",
    name: "圆月轮斩",
    category: "斩击",
    description: "刀尖绕目标画满一轮金月，光点回流收紧，一刀横断后月轮上下裂开，切向火花旋涡般甩出。",
  }, LunarRingFx),
  procDemo("sakura-flurry", {
    id: "sakura-flurry",
    name: "绯樱乱刃",
    category: "斩击",
    description: "八刀不同角度的快斩交错留痕，短暂留白后重横斩落下，所有刀痕同时迸亮并碎成花瓣刃屑。",
  }, SakuraFlurryFx),
  {
    id: "gale-crescent",
    name: "苍岚剑气",
    category: "斩击",
    description: "远端起手一闪，新月剑气携风线与残影飞来贯穿目标，气旋外卷，刀痕停顿片刻后迟发裂开。",
    color: GALE_CRESCENT.color,
    impactMs: GALE_CRESCENT.preset.impactMs,
    durationMs: GALE_CRESCENT.holdMs,
    render: () => <GaleCrescentFx preset={GALE_CRESCENT.preset} />,
  },
];

export const ART_DEMOS: readonly DemoFx[] = ATTACK_ARTS.map(artDemo);
