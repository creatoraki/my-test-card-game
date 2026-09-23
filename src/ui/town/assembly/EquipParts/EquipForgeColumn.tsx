// 中列：装备大图标 + 材料 + 积分。

import { getItemDef, type CostCheck } from "@/data";
import type { ItemDef, ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/items/itemArt";
import ItemTile from "@/ui/common/item/ItemTile";
import type { TooltipDirection } from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/shared/cx";
import s from "./EquipForgeColumn.module.css";

interface Props {
  stack: ItemStack | null;
  def: ItemDef | null;
  check: CostCheck | null;
  loot: number;
  ariaLabel?: string;
  onShowTooltip: (element: HTMLElement, stack: ItemStack, direction?: TooltipDirection) => void;
  onHideTooltip: () => void;
}

export function EquipForgeColumn({
  stack,
  def,
  check,
  loot,
  ariaLabel = "装备升阶",
  onShowTooltip,
  onHideTooltip,
}: Props) {
  if (!stack || !def) {
    return (
      <section className={s.column} aria-label={ariaLabel}>
        <p className={s.idle}>从左侧选择一件装备。</p>
      </section>
    );
  }

  return (
    <section className={s.column} aria-label={ariaLabel}>
      <div className={s.stage}>
        <span className={cx(s.icon, s[`r-${def.rarity}`])}>{itemIcon(def)}</span>
      </div>

      <div className={s.costs}>
        {check?.materials.length ? (
          <div className={s.materials}>
            {check.materials.map((material) => {
              const matStack: ItemStack = {
                uid: `cost-${material.itemId}`,
                itemId: material.itemId,
                count: 1,
              };
              return (
                <div
                  key={material.itemId}
                  className={cx(s.material, !material.ok && s.lacking)}
                  onPointerEnter={(event) => onShowTooltip(event.currentTarget, matStack, "right")}
                  onPointerLeave={onHideTooltip}
                  onFocus={(event) => onShowTooltip(event.currentTarget, matStack, "right")}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onHideTooltip();
                  }}
                >
                  <ItemTile
                    variant="compact"
                    stack={matStack}
                    disabled={!material.have}
                    className={s.materialTile}
                    aria-label={`${getItemDef(material.itemId).name}，持有 ${material.have}，需要 ${material.need}`}
                  />
                  <span className={s.materialName}>{getItemDef(material.itemId).name}</span>
                  <span className={s.amount}>{material.have} / {material.need}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={s.noCost}>无需材料。</p>
        )}

        {check?.loot && (
          <div className={cx(s.loot, !check.loot.ok && s.lacking)}>
            <span className={s.lootLabel}>居民积分</span>
            <strong className={s.lootValue}>
              {loot.toLocaleString()} / {check.loot.need.toLocaleString()}
            </strong>
          </div>
        )}
      </div>
    </section>
  );
}
