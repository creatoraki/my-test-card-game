import type { ShowcasePageDef, ShowcasePropDef } from "./showcaseTypes";

const PROP_POSITIONS = [450, 850, 1250, 1650];

type VisualPropDef = Pick<ShowcasePropDef, "id" | "art" | "name">;

/** 每 4 件一页，沿用探索场景尺寸档；没有物件时保留一个空页。 */
function paginate(id: string, series: string, name: string, props: readonly VisualPropDef[]): ShowcasePageDef[] {
  const count = Math.max(1, Math.ceil(props.length / 4));
  return Array.from({ length: count }, (_, index) => ({
    id: `${id}-${index + 1}`, series,
    name: count > 1 ? `${name} ${index + 1}` : name,
    props: props.slice(index * 4, index * 4 + 4).map((prop, slot) => ({
      id: prop.id, name: prop.name, x: PROP_POSITIONS[slot], art: prop.art,
    })),
  }));
}

/**
 * 还没调好游戏内倍率的通用素材；调好并录入 ui/art/corridor/commonPropTuning.ts 后从这里移除。
 * 目前全部调完，新素材需要调尺寸时往这里加，art 取 COMMON_PROP_ASSETS[素材 id]（id 不要和已用过的重复；已用过 redesign- 与 remade- 前缀）。
 */
const PENDING_PROPS: readonly VisualPropDef[] = [];

export const CURIO_VISUAL_PAGES: readonly ShowcasePageDef[] = paginate("visual-pending", "通用素材", "待调素材", PENDING_PROPS);
