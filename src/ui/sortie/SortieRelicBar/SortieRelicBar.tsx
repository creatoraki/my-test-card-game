import { useMemo, type KeyboardEvent } from "react";
import { getItemDef } from "@/data";
import { SORTIE_RELIC_LIMIT, useSortieStore } from "@/store/sortieStore";
import ItemInventoryPanel from "@/ui/common/item/ItemInventoryPanel";
import { cx } from "@/ui/common/cx";
import { SORTIE_RELIC_COLORS } from "@/ui/sortie/styles/inventoryPalettes";
import s from "./SortieRelicBar.module.css";

interface Props {
  className?: string;
  onOpen: (entry: HTMLElement) => void;
}

export function SortieRelicBar({ className, onOpen }: Props) {
  const backpack = useSortieStore((state) => state.backpack);
  const relics = useMemo(
    () =>
      backpack
        .filter((stack) => getItemDef(stack.itemId).category === "relic")
        .slice(0, SORTIE_RELIC_LIMIT),
    [backpack],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen(event.currentTarget);
  };

  return (
    <div
      className={cx(s.entry, className)}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-label="打开遗物携带面板"
      onClick={(event) => onOpen(event.currentTarget)}
      onKeyDown={handleKeyDown}
    >
      <ItemInventoryPanel
        className={s.panel}
        stacks={relics}
        rows={2}
        columns={3}
        compact
        capacity={SORTIE_RELIC_LIMIT}
        occupied={relics.length}
        title="遗物"
        subtitle="点击编辑本次携带"
        capacityLabel="本次携带"
        gridLabel="遗物携带格位"
        panelId="sortie-relic-bar"
        colorMap={SORTIE_RELIC_COLORS}
        selectedUid={null}
      />
    </div>
  );
}
