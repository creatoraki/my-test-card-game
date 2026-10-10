import { COMMON_PROP_ASSETS, type CommonPropAssetId } from "@/ui/art/corridor/commonPropAssets";
import type { ShowcasePageDef } from "./showcaseTypes";

const PROP_POSITIONS = [450, 850, 1250, 1650];

/** id 沿用最初分页时的编号，预览页已存的倍率、偏移、启用状态才能对上；改动分页时不要改 id。 */
interface VisualPropDef {
  id: string;
  asset: CommonPropAssetId;
  name: string;
}

/**
 * 还没调好游戏内倍率的通用素材；调好并录入 ui/art/corridor/commonPropTuning.ts 后从这里移除。
 * 目前全部调完，新素材需要调尺寸时再往这里加（id 不要和已用过的重复；已用过 redesign- 前缀的 8 个）。
 */
const PENDING_PROPS: readonly VisualPropDef[] = [];

/** 每 4 件一页，直接使用游戏内素材表与尺寸档，所见即游戏内比例；没有物件时保留一个空页。 */
function paginate(id: string, series: string, name: string, props: readonly VisualPropDef[]): ShowcasePageDef[] {
  const count = Math.max(1, Math.ceil(props.length / 4));
  return Array.from({ length: count }, (_, index) => ({
    id: `${id}-${index + 1}`, series,
    name: count > 1 ? `${name} ${index + 1}` : name,
    props: props.slice(index * 4, index * 4 + 4).map((prop, slot) => ({
      id: prop.id, name: prop.name, x: PROP_POSITIONS[slot], art: COMMON_PROP_ASSETS[prop.asset],
    })),
  }));
}

export const CURIO_VISUAL_PAGES: readonly ShowcasePageDef[] = [
  ...paginate("visual-pending", "通用素材", "待调素材", PENDING_PROPS),
];
