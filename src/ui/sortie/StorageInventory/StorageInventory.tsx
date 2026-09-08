import { useMemo } from "react";
import { getItemDef } from "@/data";
import { mergeStacksForDisplay, sortStacks } from "@/items/inventory";
import { RARITY_ORDER } from "@/items/types";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import ItemInventoryPanel from "@/ui/common/item/ItemInventoryPanel";
import { SORTIE_STORAGE_COLORS } from "@/ui/sortie/styles/inventoryPalettes";
import s from "./StorageInventory.module.css";

interface Props {
  className?: string;
  /** 取出成功。★ 面板自己不再弹提示 —— 出击准备页的所有反馈都归售货机器人说。 */
  onTaken?: () => void;
  /** 背包塞不下。 */
  onFull?: () => void;
}

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);
const CELLS = 4;

export function StorageInventory({ className, onTaken, onFull }: Props) {
  const storage = useTownStore((state) => state.storage);
  const takeFromStorage = useSortieStore((state) => state.takeFromStorage);
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

  return (
    <ItemInventoryPanel
      className={cx(s.panel, className)}
      stacks={visible}
      rows={1}
      columns={CELLS}
      kicker="出击物资 // 仓库"
      title="仓库"
      compact
      subtitle="点击取出到背包"
      capacity={CELLS}
      occupied={visible.length}
      capacityLabel="可取消耗品"
      gridLabel="仓库消耗品格位"
      panelId="sortie-storage-panel"
      colorMap={SORTIE_STORAGE_COLORS}
      selectedUid={null}
      onSelect={(stack) => {
        if (!stack) return;
        if (takeFromStorage(stack.uid)) onTaken?.();
        else onFull?.();
      }}
    />
  );
}
