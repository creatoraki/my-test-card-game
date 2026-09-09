import { PANEL_RECT } from "./cryoChoreo";
import { CLOSE_MS, usePanelMorph } from "@/ui/common/panelMorph";
import { useFacilityPanelExit } from "@/ui/town/facilityExit";

export type PanelId = "revive" | "nutrition";
export function useCryoMorph() {
  const morph = usePanelMorph<PanelId>({ rects: PANEL_RECT });
  useFacilityPanelExit(() => {
    if (!morph.panel) return 0;
    morph.closePanel();
    return CLOSE_MS;
  });
  return morph;
}
