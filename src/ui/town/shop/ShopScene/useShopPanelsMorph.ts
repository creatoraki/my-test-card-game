import { useCallback } from "react";
import { CLOSE_MS, usePanelMorph } from "@/ui/common/panelMorph";
import { useFacilityPanelExit } from "@/ui/town/facilityExit";

// 两块面板的构图(1920×1080 设计 px): 左右留白各 64, 中缝 36,
// 顶边 178 让开左上角标题块(y42 + 高约 112 = 底 154)再留一档呼吸, 底边 954。
// ⚠ 中缝**必须**是正值 —— 两块面板各自带 ±4° 的透视旋转, 一旦贴边或重叠,
//    旋转后的近端角会互相穿插, 悬浮投影也会糊成一片。
export const WAREHOUSE_RECT = { x: 64, y: 178, w: 660, h: 776 };
export const VENDING_RECT = { x: 760, y: 178, w: 1096, h: 776 };

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
  const mounted = warehouse.panel !== null;
  useFacilityPanelExit(() => {
    if (!mounted) return 0;
    closePanels();
    return CLOSE_MS;
  });

  return {
    warehouse,
    vending,
    openPanels,
    closePanels,
    mounted,
    open: mounted,
    closing: warehouse.phase === "closing",
  };
}
