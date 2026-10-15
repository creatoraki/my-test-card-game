import type { GlslProgramDef } from "@/ui/common/fx/GlslSprite";
import { CARD_DEFS } from "@/data";
import { ANIM } from "@/ui/battle/choreo/animations";
import { MAGIC_PROGRAMS, MAGIC_TIMELINE, type MagicFxKind } from "@/ui/battle/fx/MagicFx";
import type { BotanistFxKind } from "@/ui/battle/fx/BotanistFx";
import { BOTANIST_FX_SPECS } from "./botanistFxSpecs";

/** 演示页的角色分组(切换角色才显示该角色的特效)。 */
export const FX_OWNERS = ["预言家", "咒术师", "植物学家"] as const;

/**
 * 一种攻击特效的演示规格。着色器、时间轴、主色全部取自战斗模块(ui/battle/fx/MagicFx、BotanistFx 与 ANIM)，
 * 分配卡牌按卡牌定义表的 anim 实时反查；植物学家的见 botanistFxSpecs。演示页只补名称。
 */
export interface MagicFxSpec {
  id: MagicFxKind | BotanistFxKind;
  name: string;
  owner: (typeof FX_OWNERS)[number];
  color: string;
  mode: "single" | "stage";
  cards: readonly string[];
  impactMs: number;
  totalMs: number;
  program: GlslProgramDef;
  texture?: boolean;
}

interface DemoText {
  id: MagicFxKind;
  name: string;
  owner: MagicFxSpec["owner"];
}

const DEMO_TEXT: readonly DemoText[] = [
  { id: "star-shard", name: "碎星矢", owner: "预言家" },
  { id: "twin-orbit", name: "双星轨", owner: "预言家" },
  { id: "meteor-fall", name: "星陨", owner: "预言家" },
  { id: "astral-verdict", name: "星盘裁决", owner: "预言家" },
  { id: "gravity-lens", name: "引力透镜", owner: "预言家" },
  { id: "star-curtain", name: "星幕", owner: "预言家" },
  { id: "curse-nail", name: "咒钉", owner: "咒术师" },
  { id: "talisman-seal", name: "符咒", owner: "咒术师" },
  { id: "binding-hex", name: "缠丝怨咒", owner: "咒术师" },
  { id: "doom-clock", name: "死兆钟盘", owner: "咒术师" },
  { id: "soul-rend", name: "魂魄抽离", owner: "咒术师" },
  { id: "spirit-tide", name: "怨灵潮", owner: "咒术师" },
];

const MAGIC_SPECS: readonly MagicFxSpec[] = DEMO_TEXT.map((text) => {
  const programDef = MAGIC_PROGRAMS[text.id];
  return {
    ...text,
    color: ANIM[text.id].color,
    mode: programDef.mode,
    texture: programDef.texture,
    program: programDef.program,
    impactMs: MAGIC_TIMELINE[text.id].impact,
    totalMs: MAGIC_TIMELINE[text.id].total,
    cards: CARD_DEFS.filter((def) => def.anim === text.id).map((def) => def.id),
  };
});

/** 演示页全部特效：预言家、咒术师各 6 种 + 植物学家 5 种。 */
export const MAGIC_FX_SPECS: readonly MagicFxSpec[] = [...MAGIC_SPECS, ...BOTANIST_FX_SPECS];
