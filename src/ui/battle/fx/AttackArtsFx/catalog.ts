export type AttackArtId =
  | "moon-cleave" | "rift-cleave" | "comet-arrow" | "rain-arrow"
  | "venom-bloom" | "toxic-bind" | "ember-brand" | "solar-pyre"
  | "oracle-verdict" | "fate-wheel";

export interface AttackArt {
  id: AttackArtId;
  name: string;
  category: string;
  description: string;
  color: string;
  impactMs: number;
  durationMs: number;
}

export const ATTACK_ARTS: readonly AttackArt[] = [
  { id: "moon-cleave", name: "弦月断空", category: "斩击", color: "#8edbff", impactMs: 580, durationMs: 1500,
    description: "月弧掠过，细碎冷光沿刀痕回流，凝成白芯后炸开弦月冲击。" },
  { id: "rift-cleave", name: "裂隙拔刀", category: "斩击", color: "#b2a2ff", impactMs: 700, durationMs: 1700,
    description: "一线拔刀撕开空间，两侧裂隙错位张开，锐光与棱形碎片迸射。" },
  { id: "comet-arrow", name: "彗星贯矢", category: "弓箭", color: "#79e9ff", impactMs: 760, durationMs: 1700,
    description: "光弓拉满，长尾彗矢贯穿目标，连续音障环沿箭道向外扩散。" },
  { id: "rain-arrow", name: "星雨箭阵", category: "弓箭", color: "#a4b9ff", impactMs: 640, durationMs: 1950,
    description: "空中展开弧形弓阵，七支星矢错拍坠落，汇成一簇放射星芒。" },
  { id: "venom-bloom", name: "蚀骨毒绽", category: "中毒", color: "#a3f76c", impactMs: 650, durationMs: 2000,
    description: "毒珠向伤口聚拢，腐蚀花瓣层层绽开，留下翻涌毒雾与上浮气泡。" },
  { id: "toxic-bind", name: "蛇缚侵蚀", category: "中毒", color: "#52efbb", impactMs: 800, durationMs: 2100,
    description: "双股蛇形毒流缠绕目标，收紧成毒印，随后断裂成腐蚀液滴。" },
  { id: "ember-brand", name: "烙火焚痕", category: "烧伤", color: "#ff9b57", impactMs: 620, durationMs: 2000,
    description: "三道灼红烙痕骤亮，火舌沿裂口升腾，余烬缓缓剥落。" },
  { id: "solar-pyre", name: "日冕爆燃", category: "烧伤", color: "#ffd175", impactMs: 800, durationMs: 2100,
    description: "火星压缩为炽白日核，日冕冲击向外翻卷，留下旋转焰环与灰烬。" },
  { id: "oracle-verdict", name: "神谕裁决", category: "预言家", color: "#e0b1ff", impactMs: 950, durationMs: 2250,
    description: "三张预言牌翻面显现，中央眼眸睁开，垂直光柱穿过命运法阵。" },
  { id: "fate-wheel", name: "命轮逆转", category: "预言家", color: "#ffdc96", impactMs: 1100, durationMs: 2400,
    description: "六张星牌绕轮旋转，命运丝线收束目标，卡牌化作金紫色星屑。" },
];
