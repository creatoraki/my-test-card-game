import { getItemDef, materialCount, type ModuleRecipe } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./CraftMaterialRack.module.css";

interface Props {
  /** 当前角色的全部配方 —— 材料列表取它们的并集, 换角色即换清单。 */
  recipes: ModuleRecipe[];
  storage: ItemStack[];
  /** 选中的配方: 它用到的材料会被标出需求量, 其余只显示存量。 */
  recipe: ModuleRecipe | null;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

/** 材料仓库: 当前角色的配方会用到的材料及其库存。位置对应「模组装配」的模组仓库。 */
export function CraftMaterialRack({ recipes, storage, recipe, onShowTooltip, onHideTooltip }: Props) {
  const itemIds = [...new Set(recipes.flatMap((entry) => entry.materials.map((m) => m.itemId)))];

  return (
    <aside className={s.rack} aria-label="材料仓库">
      <div className={s.heading}>
        <span className={s.kicker}>材料仓库</span>
        <span className={s.count}>{itemIds.length} 种</span>
      </div>
      {itemIds.length ? (
        <div className={s.grid}>
          {itemIds.map((itemId) => {
            const have = materialCount(storage, itemId);
            const need = recipe?.materials.find((m) => m.itemId === itemId)?.count ?? 0;
            const enough = have >= need;
            // 仓库里是逐 uid 的独立堆, 这里合并成一个只用于展示的堆。
            const stack: ItemStack = { uid: `material-${itemId}`, itemId, count: Math.max(have, 1) };
            return (
              <div
                key={itemId}
                className={cx(s.option, need > 0 && s.required, need > 0 && !enough && s.lacking)}
                onPointerEnter={(event) => onShowTooltip(event.currentTarget, stack)}
                onPointerLeave={onHideTooltip}
                onFocus={(event) => onShowTooltip(event.currentTarget, stack)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onHideTooltip();
                }}
              >
                <ItemSlot
                  stack={stack}
                  showName={false}
                  disabled={have === 0}
                  aria-label={`${getItemDef(itemId).name}，持有 ${have}${need ? `，本次需要 ${need}` : ""}`}
                  className={s.slot}
                />
                <span className={s.stock} aria-hidden="true">
                  {need > 0 ? `${have} / ${need}` : `${have}`}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={s.empty}>
          <span className={s.emptySlot} aria-hidden="true" />
          <span>该角色无需任何材料</span>
        </div>
      )}
    </aside>
  );
}
