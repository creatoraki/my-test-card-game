import { useMemo, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { RULES } from "@/engine";
import { getItemDef } from "@/data";
import { mergeStacksForDisplay, sortStacks } from "@/items/inventory";
import { RARITY_ORDER, type ItemStack } from "@/items/types";
import { SORTIE_RELIC_LIMIT, sortieUsedSlots, useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { PanelShell } from "@/ui/common/PanelShell";
import { cx } from "@/ui/common/cx";
import type { Rect } from "@/ui/common/panelMorph";
import ItemInventoryPanel from "@/ui/common/item/ItemInventoryPanel";
import { SORTIE_RELIC_COLORS } from "@/ui/sortie/styles/inventoryPalettes";
import s from "./SortieRelicPanel.module.css";

const RELIC_ACCENT = "#d2a2ff";
const RELIC_THEME = {
  "--asm-frame": RELIC_ACCENT,
  "--asm-glow": RELIC_ACCENT,
  "--asm-select": "#f5d18d",
  "--asm-cyan": "#f6d28f",
  "--asm-line": "#d8b6ff2e",
  "--asm-ink": "#fbf4ff",
  "--asm-ink-dim": "#c1aed0",
  "--asm-panel-bg": "#130d1cf2",
  "--asm-panel-filter": "blur(10px) saturate(112%) brightness(0.82)",
  "--panel-shell-title-size": "34px",
  "--panel-shell-status-size": "20px",
  "--panel-shell-close-size": "36px",
} as CSSProperties;

const RELIC_COLUMNS = 6;
const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);

export interface SortieRelicPanelProps {
  closing: boolean;
  onClose: () => void;
  className?: string;
  morph?: {
    ref: Ref<HTMLElement>;
    rect: Rect;
    ready: boolean;
    seed?: ReactNode;
    seedLabel?: string;
  };
}

export function SortieRelicPanel({ closing, onClose, className, morph }: SortieRelicPanelProps) {
  const storage = useTownStore((state) => state.storage);
  const backpack = useSortieStore((state) => state.backpack);
  const takeFromStorage = useSortieStore((state) => state.takeFromStorage);
  const putBack = useSortieStore((state) => state.putBack);
  const [notice, setNotice] = useState<string | null>(null);

  const storageRelics = useMemo(
    () =>
      sortStacks(
        mergeStacksForDisplay(
          storage.filter((stack) => getItemDef(stack.itemId).category === "relic"),
          getItemDef,
        ),
        getItemDef,
        rarityRank,
      ),
    [storage],
  );
  const carriedRelics = useMemo(
    () =>
      backpack
        .filter((stack) => getItemDef(stack.itemId).category === "relic")
        .slice(0, SORTIE_RELIC_LIMIT),
    [backpack],
  );

  const handleStorageSelect = (stack: ItemStack | null) => {
    if (!stack) return;
    if (takeFromStorage(stack.uid)) {
      setNotice(null);
      return;
    }

    const currentBackpack = useSortieStore.getState().backpack;
    const currentRelicCount = currentBackpack.filter(
      (item) => getItemDef(item.itemId).category === "relic",
    ).length;
    if (currentRelicCount >= SORTIE_RELIC_LIMIT) {
      setNotice("已达携带上限，先移出一件");
    } else if (sortieUsedSlots(currentBackpack) >= RULES.burden.backpackSlots) {
      setNotice("背包已满，先腾出一格");
    } else {
      setNotice("这件遗物暂时无法装入");
    }
  };

  const handleCarriedSelect = (stack: ItemStack | null) => {
    if (!stack) return;
    putBack(stack.uid);
    setNotice(null);
  };

  return (
    <PanelShell
      accent={RELIC_ACCENT}
      title="遗物携带"
      status={
        <>
          本次携带 {carriedRelics.length}/{SORTIE_RELIC_LIMIT}
          {notice && <span className={s.statusNotice}> · {notice}</span>}
        </>
      }
      closeLabel="关闭遗物面板"
      closing={closing}
      onClose={onClose}
      themeStyle={RELIC_THEME}
      className={className}
      morph={morph}
    >
      <div className={s.body}>
        <ItemInventoryPanel
          className={cx(s.inventory, s.storage)}
          stacks={storageRelics}
          rows={Math.max(1, Math.ceil(storageRelics.length / RELIC_COLUMNS))}
          columns={RELIC_COLUMNS}
          kicker="出击物资 // 遗物仓库"
          title="仓库遗物"
          subtitle="点击遗物装入本次出击"
          capacity={storageRelics.length}
          occupied={storageRelics.length}
          capacityLabel="仓库遗物"
          gridLabel="仓库遗物格位"
          panelId="sortie-relic-storage-panel"
          colorMap={SORTIE_RELIC_COLORS}
          selectedUid={null}
          onSelect={handleStorageSelect}
        />
        <ItemInventoryPanel
          className={cx(s.inventory, s.carried)}
          stacks={carriedRelics}
          rows={2}
          columns={3}
          kicker="出击物资 // 携带清单"
          title="本次携带"
          subtitle="点击遗物移出到仓库"
          capacity={SORTIE_RELIC_LIMIT}
          occupied={carriedRelics.length}
          capacityLabel="本次携带"
          gridLabel="本次遗物携带格位"
          panelId="sortie-relic-carried-panel"
          colorMap={SORTIE_RELIC_COLORS}
          selectedUid={null}
          onSelect={handleCarriedSelect}
        />
      </div>
    </PanelShell>
  );
}
