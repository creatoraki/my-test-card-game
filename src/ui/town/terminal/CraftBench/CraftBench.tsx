// 「03 制造详情」面板: 产出预览(图标 / 名称 / 状态 / 效果) + 所需材料 + 制造按钮。
import { getItemDef, type CraftCheck, type ModuleRecipe } from "@/data";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/items/itemArt";
import { craftStatusLabel } from "../CraftRecipeGrid/craftStatus";
import { TerminalPanel } from "../TerminalPanel";
import { CraftButton } from "./CraftButton";
import { CraftCostList } from "./CraftCostList";
import s from "./CraftBench.module.css";

type BenchState = "empty" | "ready" | "blocked";

interface Props {
  recipe: ModuleRecipe | null;
  check: CraftCheck | null;
  /** 制造者当前的可用经验池。 */
  exp: number;
  className?: string;
  onCraft: () => void;
  onShowTooltip?: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip?: () => void;
}

export function CraftBench({ recipe, check, exp, className, onCraft, onShowTooltip, onHideTooltip }: Props) {
  const state: BenchState = !recipe ? "empty" : check?.ok ? "ready" : "blocked";
  const def = recipe ? getItemDef(recipe.itemId) : null;
  // tooltip 需要一个 ItemStack, 产出物尚未入库, 这里造一个只用于展示的临时堆。
  const previewStack: ItemStack | null = recipe
    ? { uid: `preview-${recipe.itemId}`, itemId: recipe.itemId, count: 1 }
    : null;

  return (
    <TerminalPanel
      index="03"
      title="制造详情"
      deco="DETAILS"
      rule="hot"
      ariaLabel="模组制造详情"
      className={className}
      bodyClassName={s.body}
    >
      <div className={s.product} data-state={state}>
        <div
          className={s.slot}
          tabIndex={previewStack ? 0 : -1}
          role={previewStack ? "button" : undefined}
          aria-label={def ? `查看${def.name}详情` : undefined}
          onPointerEnter={(event) => previewStack && onShowTooltip?.(event.currentTarget, previewStack)}
          onPointerLeave={onHideTooltip}
          onFocus={(event) => previewStack && onShowTooltip?.(event.currentTarget, previewStack)}
          onBlur={onHideTooltip}
        >
          {def ? <span className={s.slotIcon}>{itemIcon(def)}</span> : <span className={s.slotEmpty} aria-hidden="true" />}
        </div>
        <div className={s.info}>
          <div className={s.infoHead}>
            <strong className={s.name}>{def?.name ?? "未选择模组"}</strong>
            {recipe && (
              <span className={s.state} aria-live="polite">
                {craftStatusLabel(check)}
              </span>
            )}
          </div>
          <p className={s.desc}>{def?.desc ?? "从制造清单中选择要制造的模组。"}</p>
        </div>
      </div>
      <span className={s.divider} aria-hidden="true" />
      <div className={s.materialsHead}>
        <span>所需材料</span>
        <span className={s.materialsDeco} aria-hidden="true">
          <i>//</i>REQUIRED MATERIALS
        </span>
      </div>
      {recipe ? (
        <CraftCostList
          recipe={recipe}
          check={check}
          exp={exp}
          onShowTooltip={onShowTooltip}
          onHideTooltip={onHideTooltip}
        />
      ) : (
        <p className={s.costEmpty}>选择模组后显示所需材料</p>
      )}
      <div className={s.footer}>
        <CraftButton disabled={!check?.ok} onClick={onCraft} />
      </div>
    </TerminalPanel>
  );
}
