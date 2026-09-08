import { getItemDef, type CraftCheck, type ModuleRecipe } from "@/data";
import { itemIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import s from "./CraftRecipeGrid.module.css";

interface Props {
  recipes: ModuleRecipe[];
  /** 与 recipes 一一对应的可行性判定, 由面板统一算好传进来。 */
  checks: Record<string, CraftCheck>;
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
}

/** 制造清单: 当前角色能造的模组。与「模组装配」的卡组网格同一套选中语言。 */
export function CraftRecipeGrid({ recipes, checks, selectedItemId, onSelect }: Props) {
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
            return (
              <button
                key={recipe.itemId}
                type="button"
                className={cx(s.entry, selected && s.selected, !check?.ok && s.blocked)}
                aria-pressed={selected}
                aria-label={`选择${def.name}，${label}`}
                onClick={() => onSelect(recipe.itemId)}
              >
                <span className={s.icon}>{itemIcon(def)}</span>
                <span className={s.info}>
                  <strong className={s.name}>{def.name}</strong>
                  <span className={s.desc}>{def.desc}</span>
                </span>
                <span className={s.status} data-ok={check?.ok ?? false}>{label}</span>
              </button>
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
