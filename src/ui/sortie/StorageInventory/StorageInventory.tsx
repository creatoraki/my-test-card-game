import { useMemo, useState } from "react";
import { getItemDef } from "@/data";
import { mergeStacksForDisplay, sortStacks } from "@/items/inventory";
import { RARITY_ORDER } from "@/items/types";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import ItemInventoryPanel, {
  type InventoryColorMap,
} from "@/ui/common/item/ItemInventoryPanel";
import s from "./StorageInventory.module.css";

interface Props {
  className?: string;
}

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);
const CELLS = 4;

const STORAGE_COLORS: InventoryColorMap = {
  panel: "#0b1a1fa6",
  panelDeep: "#04090cb3",
  panelGlow: "#ffffff14",
  panelLine: "#ffffff3d",
  frame: "#ffffffb3",
  frameHot: "#ffffff",
  accent: "#ffffffe6",
  accentAlt: "#75e1d4",
  text: "#ffffff",
  muted: "#b6c7c9",
  tray: "#ffffff0f",
  trayBorder: "#ffffff33",
  slot: "#ffffff12",
  slotBorder: "#ffffff2e",
  slotHover: "#ffffff2b",
  selected: "#c7fff6",
  selectedGlow: "#c7fff666",
  emptySlot: "#ffffff0a",
};

export function StorageInventory({ className }: Props) {
  const storage = useTownStore((state) => state.storage);
  const takeFromStorage = useSortieStore((state) => state.takeFromStorage);
  const [notice, setNotice] = useState<string | null>(null);
  const visible = useMemo(
    () =>
      sortStacks(
        mergeStacksForDisplay(
          storage.filter((stack) => getItemDef(stack.itemId).category === "consumable"),
          getItemDef,
        ),
        getItemDef,
        rarityRank,
      ).slice(0, CELLS),
    [storage],
  );

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 1500);
  };

  return (
    <ItemInventoryPanel
      className={cx(s.panel, className)}
      stacks={visible}
      rows={1}
      columns={CELLS}
      kicker="SORTIE // STORAGE"
      title="仓库"
      compact
      subtitle={notice ?? "SELECT TO LOAD"}
      capacity={CELLS}
      occupied={visible.length}
      capacityLabel="可取消耗品"
      gridLabel="仓库消耗品格位"
      panelId="sortie-storage-panel"
      colorMap={STORAGE_COLORS}
      selectedUid={null}
      onSelect={(stack) => {
        if (!stack) return;
        if (!takeFromStorage(stack.uid)) showNotice("背包已满");
      }}
    />
  );
}