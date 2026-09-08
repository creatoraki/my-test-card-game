import { getItemDef, type CraftCheck, type ModuleRecipe } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./CraftRecipeGrid.module.css";

interface Props {
  recipes: ModuleRecipe[];
  /** 与 recipes 一一对应的可行性判定, 由面板统一算好传进来。 */
  checks: Record<string, CraftCheck>;
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

/** 制造清单: 当前角色能造的模组。与右侧模组仓库共用物品格与选中语言。 */
export function CraftRecipeGrid({
  recipes,
  checks,
  selectedItemId,
  onSelect,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  return (
    <section className={s.grid} aria-label="可制造模组">
      <div className={s.heading}>
        <span className={s.kicker}>制造清单</span>
        <span className={s.count}>{recipes.length} 种</span>
      </div>
      {recipes.length ? (
        <div className={s.list}>
          {recipes.map((recipe) => {
            const def = getItemDef(recipe.itemId);
            const check = checks[recipe.itemId];
            const selected = recipe.itemId === selectedItemId;
            const label = !check?.expOk
              ? "经验不足"
              : check.ok
                ? "材料齐备"
                : "材料不足";
            const shortLabel = !check?.expOk ? "缺经验" : check.ok ? "齐备" : "缺材料";
            const stack: ItemStack = { uid: `recipe-${recipe.itemId}`, itemId: recipe.itemId, count: 1 };
            return (
              <div
                key={recipe.itemId}
                className={cx(s.option, selected && s.selected, !check?.ok && s.blocked)}
                onPointerEnter={(event) => onShowTooltip(event.currentTarget, stack)}
                onPointerLeave={onHideTooltip}
                onFocus={(event) => onShowTooltip(event.currentTarget, stack)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onHideTooltip();
                }}
              >
                <ItemSlot
                  stack={stack}
                  showName
                  showCount={false}
                  selected={selected}
                  aria-label={`选择${def.name}，${label}`}
                  onClick={() => onSelect(recipe.itemId)}
                  className={s.slot}
                />
                <span className={s.status} data-ok={check?.ok ?? false} aria-hidden="true">
                  {shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={s.empty}>
          <span className={s.emptySlot} aria-hidden="true" />
          <span>该角色暂无可制造的模组</span>
        </div>
      )}
    </section>
  );
}
