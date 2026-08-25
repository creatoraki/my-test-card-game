import { getItemDef, type CraftCheck, type ModuleRecipe } from "@/data";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/itemArt";
import { EventPanelButton } from "@/ui/common/EventPanel";
import { cx } from "@/ui/common/cx";
import { CraftIcon } from "../AssemblyScene/icons";
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

/** 制造台: 产出预览 + 经验/材料消耗清单 + 制造按钮。与「模组装配」的装配台同一位置、同一节奏。 */
export function CraftBench({
  recipe,
  check,
  exp,
  className,
  onCraft,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const state: BenchState = !recipe ? "empty" : check?.ok ? "ready" : "blocked";
  const stateLabel = !recipe ? "先选择模组" : check?.ok ? "可制造" : "材料不足";
  const def = recipe ? getItemDef(recipe.itemId) : null;
  // tooltip 需要一个 ItemStack, 产出物尚未入库, 这里造一个只用于展示的临时堆。
  const previewStack: ItemStack | null = recipe
    ? { uid: `preview-${recipe.itemId}`, itemId: recipe.itemId, count: 1 }
    : null;
  const shortage = !check
    ? ""
    : [
        !check.expOk ? "经验不足" : "",
        ...check.materials.filter((m) => !m.ok).map((m) => `缺${getItemDef(m.itemId).name}×${m.need - m.have}`),
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <section className={cx(s.bench, className)} data-state={state} aria-label="模组制造台">
      <div className={s.benchHeader}>
        <strong>制造台</strong>
        <span className={s.state} aria-live="polite">{stateLabel}</span>
      </div>
      <div className={s.benchSurface}>
        <div
          className={s.moduleSlot}
          tabIndex={previewStack ? 0 : -1}
          role={previewStack ? "button" : undefined}
          aria-label={def ? `查看${def.name}详情` : undefined}
          onPointerEnter={(event) => previewStack && onShowTooltip?.(event.currentTarget, previewStack)}
          onPointerLeave={onHideTooltip}
          onFocus={(event) => previewStack && onShowTooltip?.(event.currentTarget, previewStack)}
          onBlur={onHideTooltip}
        >
          {def ? (
            <span className={s.moduleIcon}>{itemIcon(def)}</span>
          ) : (
            <span className={s.slotPlaceholder} aria-hidden="true" />
          )}
          <span className={s.slotMark}>{def ? def.name : "产出槽"}</span>
        </div>
        <ul className={s.costList}>
          {recipe ? (
            <>
              <li className={s.costRow} data-ok={check?.expOk ?? false}>
                <span className={s.costName}>经验</span>
                <span className={s.costValue}>
                  {recipe.exp} <i className={s.costHave}>/ 持有 {exp}</i>
                </span>
              </li>
              {check?.materials.map((material) => (
                <li key={material.itemId} className={s.costRow} data-ok={material.ok}>
                  <span className={s.costName}>{getItemDef(material.itemId).name}</span>
                  <span className={s.costValue}>
                    {material.need} <i className={s.costHave}>/ 持有 {material.have}</i>
                  </span>
                </li>
              ))}
            </>
          ) : (
            <li className={s.costEmpty}>从左侧选择要制造的模组</li>
          )}
        </ul>
      </div>
      <div className={s.benchFooter}>
        {shortage && <p className={s.shortage}>{shortage}</p>}
        <EventPanelButton
          className={s.actionButton}
          tone="primary"
          disabled={!check?.ok}
          onClick={onCraft}
          aria-label="制造选中的模组"
        >
          <><CraftIcon /> 制造</>
        </EventPanelButton>
      </div>
    </section>
  );
}
