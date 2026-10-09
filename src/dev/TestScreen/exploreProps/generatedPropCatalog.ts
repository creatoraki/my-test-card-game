import { CORRIDOR_CHARACTER_HEIGHT, CORRIDOR_PROP_BASE_SCALE, CORRIDOR_PROP_HEIGHT_RATIOS } from "@/ui/art/corridor/corridorPropSizing";
import type { ShowcasePageDef, ShowcasePropDef } from "./showcaseTypes";
import assets from "./generatedPropAssets.json";

/** 四宫格位置序号（0 左上 / 1 右上 / 2 左下 / 3 右下）；物件 id 用它拼接，删减物件后已存的倍率仍能对上。 */
type Slot = 0 | 1 | 2 | 3;

interface SheetDef {
  id: string;
  series: string;
  name: string;
  file: string;
  props: readonly { slot: Slot; name: string }[];
}

const POSITION_NAMES = ["左上", "右上", "左下", "右下"] as const;
const PROP_POSITIONS = [450, 850, 1250, 1650];
const ASSET_DIRECTORY = "/src/assets/test-screen/物品演示";
const sources = import.meta.glob<string>("/src/assets/test-screen/物品演示/*.png", {
  eager: true, query: "?url", import: "default",
});

/** 只保留已选定的物件，未选中的素材已连同图片一并删除。 */
const SHEETS: readonly SheetDef[] = [
  {
    id: "industrial-two", series: "工业初稿", name: "机械货运",
    file: "奇物四宫格_第一批_方案2",
    props: [{ slot: 0, name: "错落货箱堆" }, { slot: 2, name: "机械铁砧" }],
  },
  {
    id: "fantasy-forest", series: "奇幻遗物", name: "森灵遗物",
    file: "奇物四宫格_奇幻_方案4_森灵遗物",
    props: [{ slot: 1, name: "琥珀藤环灯" }, { slot: 3, name: "森灵琥珀柱" }],
  },
  {
    id: "curios-celestial", series: "奇幻异器", name: "天工异器",
    file: "奇物四宫格_奇幻第二批_方案1_天工异器_底座修正版",
    props: [{ slot: 1, name: "星辰管风琴" }],
  },
  {
    id: "curios-occult", series: "奇幻异器", name: "诡秘祭器",
    file: "奇物四宫格_奇幻第二批_方案2_诡秘祭器_底座修正版",
    props: [{ slot: 0, name: "诡秘三烛灯" }, { slot: 1, name: "诡秘面具架" }, { slot: 3, name: "幽眼吊钟" }],
  },
  {
    id: "curios-tide", series: "奇幻异器", name: "潮汐秘藏",
    file: "奇物四宫格_奇幻第二批_方案3_潮汐秘藏",
    props: [{ slot: 1, name: "珊瑚珍珠灯" }, { slot: 3, name: "潮汐船锚琴" }],
  },
  {
    id: "curios-wonder", series: "奇幻异器", name: "异境珍玩",
    file: "奇物四宫格_奇幻第二批_方案4_异境珍玩",
    props: [{ slot: 0, name: "翠叶风车" }, { slot: 1, name: "星轨巨剪" }, { slot: 2, name: "琥珀机关匣" }],
  },
];

function createProp(sheet: SheetDef, { slot, name }: SheetDef["props"][number]): ShowcasePropDef {
  const file = `${sheet.file}_${POSITION_NAMES[slot]}.png`;
  const asset = assets.find((entry) => entry.file === file);
  const src = sources[`${ASSET_DIRECTORY}/${file}`];
  if (!asset || !src) throw new Error(`物品演示素材缺失：${file}`);
  // 主体高度约为角色的 1.35 倍；宽物件限制画布宽度，避免默认展示互相遮挡。
  const targetHeight = CORRIDOR_CHARACTER_HEIGHT * CORRIDOR_PROP_HEIGHT_RATIOS.medium;
  const scale = Math.min(targetHeight / asset.subjectHeight, 350 / asset.size) / CORRIDOR_PROP_BASE_SCALE;
  return {
    id: `${sheet.id}-${slot}`, name, x: PROP_POSITIONS[slot],
    art: { src, width: asset.size, height: asset.size, scale, groundTrim: asset.bottomMargin / asset.size },
  };
}

export const GENERATED_SHOWCASE_PAGES: readonly ShowcasePageDef[] = SHEETS.map((sheet) => ({
  id: sheet.id, series: sheet.series, name: sheet.name,
  props: sheet.props.map((prop) => createProp(sheet, prop)),
}));
