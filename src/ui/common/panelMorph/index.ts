import collapse from "./panelCollapse.module.css";

/** 关闭时挂到面板 <section> 上的公共折叠类。三个 morph 外壳只认这一个名字。 */
export const PANEL_COLLAPSE_CLASS = collapse.collapse;

export {
  CLOSE_MS,
  COLLAPSE_MS,
  CONTENT_IN_MS,
  ENTRY_BACK_DELAY_MS,
  ENTRY_BACK_MS,
  MORPH_EASE,
  OPEN_MS,
  SLIDE_MS,
  TALLEN_MS,
  WIDEN_MS,
  box,
  centered,
  designRectOf,
  type Rect,
} from "./panelChoreo";
export { usePanelMorph, type PanelMorphPhase } from "./usePanelMorph";
