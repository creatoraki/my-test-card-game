import { CARD_DEFS } from "@/data";
import { ANIM } from "@/ui/battle/choreo/animations";
import { BOTANIST_PROGRAMS, BOTANIST_TIMELINE, type BotanistFxKind } from "@/ui/battle/fx/BotanistFx";
import type { MagicFxSpec } from "./magicFxSpecs";

/**
 * 植物学家 5 种攻击特效的演示规格。着色器、时间轴取自 ui/battle/fx/BotanistFx，主色取自 ANIM，
 * 分配卡牌按卡牌定义表的 anim 实时反查。演示页只补名称。
 */
interface DemoText {
  id: BotanistFxKind;
  name: string;
}

const DEMO_TEXT: readonly DemoText[] = [
  { id: "thorn-arrow", name: "棘藤箭" },
  { id: "thorn-whip", name: "荆棘鞭笞" },
  { id: "flytrap-bite", name: "食人花噬咬" },
  { id: "spore-bloom", name: "毒孢菌爆" },
  { id: "vine-tide", name: "藤蔓缠绕" },
];

export const BOTANIST_FX_SPECS: readonly MagicFxSpec[] = DEMO_TEXT.map((text) => {
  const programDef = BOTANIST_PROGRAMS[text.id];
  const timing = BOTANIST_TIMELINE[text.id];
  return {
    ...text,
    owner: "植物学家",
    color: ANIM[text.id].color,
    mode: programDef.mode,
    texture: programDef.texture,
    program: programDef.program,
    impactMs: timing.impact,
    totalMs: timing.total,
    cards: CARD_DEFS.filter((def) => def.anim === text.id).map((def) => def.id),
  };
});
