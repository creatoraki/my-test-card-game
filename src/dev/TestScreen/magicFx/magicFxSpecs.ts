import type { GlslProgramDef } from "@/ui/common/fx/GlslSprite";
import { CARD_DEFS } from "@/data";
import { ANIM } from "@/ui/battle/choreo/animations";
import { MAGIC_PROGRAMS, MAGIC_TIMELINE, type MagicFxKind } from "@/ui/battle/fx/MagicFx";

/**
 * 一种魔法攻击特效的演示规格。着色器、时间轴、主色全部取自战斗模块(ui/battle/fx/MagicFx 与 ANIM)，
 * 分配卡牌按卡牌定义表的 anim 实时反查；演示页只补名称与说明文字。
 */
export interface MagicFxSpec {
  id: MagicFxKind;
  name: string;
  owner: "预言家" | "咒术师";
  color: string;
  mode: "single" | "stage";
  desc: string;
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
  desc: string;
}

const DEMO_TEXT: readonly DemoText[] = [
  { id: "star-shard", name: "碎星矢", owner: "预言家", desc: "四芒星矢拖着棱光尾迹疾射，三粒伴星螺旋缠绕，命中后六边晶环外扩、晶片旋转迸散。" },
  { id: "twin-orbit", name: "双星轨", owner: "预言家", desc: "一金一紫双星互绕逼近，轨道收窄、转速飙升，撞合时两道倾斜轨道环交叉外扩。" },
  { id: "meteor-fall", name: "星陨", owner: "预言家", desc: "星象准星锁定目标，陨星拖着彗尾斜坠砸下，五芒星光爆后星屑漂散。" },
  { id: "astral-verdict", name: "星盘裁决", owner: "预言家", desc: "星盘扫出刻度与星座，加速旋转后坍缩，天光柱劈落引爆六芒星冲击。" },
  { id: "gravity-lens", name: "引力透镜", owner: "预言家", desc: "目标中心撕开黑核，吸积盘旋转、螺旋星臂倒灌，坍缩后爱因斯坦环炸开、星尘反喷。" },
  { id: "star-curtain", name: "星幕", owner: "预言家", desc: "全屏群攻：上空垂下极光星幕，流星穿场，每个目标各挨一颗主陨星并同时爆开。" },
  { id: "curse-nail", name: "咒钉", owner: "咒术师", desc: "秽气旋绕、方印显形，黑芯咒钉疾射钉入，裂纹放射，头顶弹出厄运之眼。" },
  { id: "talisman-seal", name: "符咒", owner: "咒术师", desc: "黄符翻飞而来拍在目标身上，符文点亮、方印外扩、四角锁链伸出，随后青火焚符。" },
  { id: "binding-hex", name: "缠丝怨咒", owner: "咒术师", desc: "三道怨丝环自外收拢勒紧目标，咒眼睁开的一刻丝环崩断四散。" },
  { id: "doom-clock", name: "死兆钟盘", owner: "咒术师", desc: "目标身后弹出古钟盘，分针狂转三圈与时针同指子时，盘面龟裂后炸碎，十二道时刻光芒与三重钟鸣冲击环轰出。" },
  { id: "soul-rend", name: "魂魄抽离", owner: "咒术师", desc: "左上方撕开黑色漩涡，按立绘轮廓的魂影被扯离肉身、魂丝绷紧后崩断，魂影碎成残片卷入漩涡。" },
  { id: "spirit-tide", name: "怨灵潮", owner: "咒术师", desc: "全屏群攻：十八只拖尾怨灵从施法者身后呼啸横扫全场，每个目标被一只大怨灵扑中，爪痕撕开、魂屑炸散。" },
];

export const MAGIC_FX_SPECS: readonly MagicFxSpec[] = DEMO_TEXT.map((text) => {
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
