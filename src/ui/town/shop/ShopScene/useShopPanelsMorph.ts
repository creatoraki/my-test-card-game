import { useCallback } from "react";
import { usePanelMorph } from "@/ui/common/panelMorph";

export const WAREHOUSE_RECT = { x: 70, y: 140, w: 680, h: 780 };
export const VENDING_RECT = { x: 740, y: 130, w: 1150, h: 760 };

const WAREHOUSE_RECTS = { warehouse: WAREHOUSE_RECT };
const VENDING_RECTS = { vending: VENDING_RECT };

export function useShopPanelsMorph() {
  const warehouse = usePanelMorph<"warehouse">({ rects: WAREHOUSE_RECTS });
  const vending = usePanelMorph<"vending">({ rects: VENDING_RECTS });

  const openPanels = useCallback(
    (entry: HTMLElement | null) => {
      warehouse.openPanel("warehouse", entry);
      vending.openPanel("vending", entry);
    },
    [vending.openPanel, warehouse.openPanel],
  );

  const closePanels = useCallback(() => {
    warehouse.closePanel();
    vending.closePanel();
  }, [vending.closePanel, warehouse.closePanel]);

  return {
    warehouse,
    vending,
    openPanels,
    closePanels,
    mounted: warehouse.panel !== null,
    open: warehouse.panel !== null,
    closing: warehouse.phase === "closing",
  };
}
