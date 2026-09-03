import { PANEL_RECT } from "./cryoChoreo";
import { usePanelMorph } from "@/ui/common/panelMorph";

export type PanelId = "awaken" | "nutrition";
export const useCryoMorph = () => usePanelMorph<PanelId>({ rects: PANEL_RECT, entryAttr: "data-cryo-entry" });