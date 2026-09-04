// 中列: 装备大图标 + 3 样材料 + 积分。

import type { CostCheck } from "@/data";
import { getItemDef } from "@/data";
import type { ItemDef, ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/itemArt";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./EquipForgeColumn.module.css";

interface Props {
  stack: ItemStack | null;
  def: ItemDef | null;
  check: CostCheck | null;
  loot: number;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

export function EquipForgeColumn({
  stack,
  def,
  check,
  loot,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  if (!stack || !def) {
    return (
      <section className={s.column} aria-label="装备升阶">
        <p className={s.idle}>从左侧选择一件装备。</p>
      </section>
    );
  }

  return (
    <section className={s.column} aria-label="装备升阶">
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
                count: Math.max(1, material.have),
              };
              return (
                <div
                  key={material.itemId}
                  className={cx(s.material, !material.ok && s.lacking)}
                  onPointerEnter={(event) => onShowTooltip(event.currentTarget, matStack)}
                  onPointerLeave={onHideTooltip}
                  onFocus={(event) => onShowTooltip(event.currentTarget, matStack)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      onHideTooltip();
                    }
                  }}
                >
                  <ItemSlot
                    stack={matStack}
                    showName={false}
                    showCount={false}
                    disabled={!material.have}
                    aria-label={`${getItemDef(material.itemId).name}，持有 ${material.have}，需要 ${material.need}`}
                  />
                  <span className={s.materialName}>{getItemDef(material.itemId).name}</span>
                  <span className={s.amount}>
                    {material.have} / {material.need}
                  </span>
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
