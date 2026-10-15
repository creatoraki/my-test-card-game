import { BOTANIST_PROGRAMS, BOTANIST_TIMELINE, type BotanistFxKind } from "@/ui/battle/fx/BotanistFx";
import type { MagicFxSpec } from "./magicFxSpecs";

/**
 * 植物学家 5 种攻击特效的演示规格。着色器、时间轴、主色取自 ui/battle/fx/BotanistFx；
 * 尚未接入战斗，分配卡牌是拟定方案(按卡牌编号写死)，接入后改为按卡牌定义表的 anim 反查。
 */
interface DemoText {
  id: BotanistFxKind;
  name: string;
  desc: string;
  cards: readonly string[];
}

const DEMO_TEXT: readonly DemoText[] = [
  {
    id: "thorn-arrow",
    name: "棘藤箭",
    desc: "六叶准星环收拢锁定目标，木杆棘刺箭拖着螺旋藤丝疾射、沿途落叶，钉入后九根尖刺自命中点放射绽出，飞叶前冲四溅。",
    cards: ["continuous-shot", "caltrop-arrow", "thorn-burst", "recycle-shot", "venom-dart"],
  },
  {
    id: "thorn-whip",
    name: "荆棘鞭笞",
    desc: "左上方卷须盘紧蓄力，带倒刺的荆棘长鞭沿大弧线抽向右下，鞭梢扫过目标时裂光迸现，留下一道发光鞭痕，刺屑与飞叶顺势甩出。",
    cards: ["thorn-lash", "upas-tree"],
  },
  {
    id: "flytrap-bite",
    name: "食人花噬咬",
    desc: "粗茎自左下探出，两瓣捕虫夹张到最大、口内透出血光，随呼吸开合后猛然咬合，齿列交错扣死，汁液自夹口喷溅，咀嚼两下后溶解松口。",
    cards: ["insect-trap", "blood-vine"],
  },
  {
    id: "spore-bloom",
    name: "毒孢菌爆",
    desc: "目标脚下菌丝网发光蔓延，三朵毒蘑菇破土鼓胀、压扁蓄力后同时炸开，翻涌的孢子云吞没目标，毒泡鼓起又破裂。",
    cards: ["poison-mushroom"],
  },
  {
    id: "vine-tide",
    name: "藤蔓缠绕",
    desc: "全屏群攻：施法者脚下亮起法阵，每个目标一条棘藤贴地疾走而至，四条粗藤破土螺旋缠身，爆点骤然勒紧、倒刺齐弹，随后自下而上枯萎碎散。",
    cards: ["vine-entangle", "root-snare"],
  },
];

export const BOTANIST_FX_SPECS: readonly MagicFxSpec[] = DEMO_TEXT.map((text) => {
  const programDef = BOTANIST_PROGRAMS[text.id];
  const timing = BOTANIST_TIMELINE[text.id];
  return {
    ...text,
    owner: "植物学家",
    planned: true,
    color: timing.color,
    mode: programDef.mode,
    texture: programDef.texture,
    program: programDef.program,
    impactMs: timing.impact,
    totalMs: timing.total,
  };
});
