import type { ReactNode } from "react";
import { getItemDef, type CraftCheck, type ModuleRecipe } from "@/data";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/items/itemArt";
import { ExpIcon } from "./craftIcons";
import s from "./CraftCostList.module.css";

interface Props {
  recipe: ModuleRecipe;
  check: CraftCheck | null;
  /** 制造者当前的可用经验池。 */
  exp: number;
  onShowTooltip?: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip?: () => void;
}

/** 所需材料清单: 首行经验, 其后逐行材料; 每行「需求 / 持有 N」, 不足的行转琥珀色。 */
export function CraftCostList({ recipe, check, exp, onShowTooltip, onHideTooltip }: Props) {
  return (
    <ul className={s.list}>
      <CostRow icon={<ExpIcon />} name="经验" need={recipe.exp} have={exp} ok={check?.expOk ?? false} />
      {check?.materials.map((material) => {
        const def = getItemDef(material.itemId);
        // 仓库里是逐 uid 的独立堆, 这里合并成一个只用于提示展示的堆。
        const stack: ItemStack = { uid: `material-${material.itemId}`, itemId: material.itemId, count: Math.max(material.have, 1) };
        return (
          <CostRow
            key={material.itemId}
            icon={itemIcon(def)}
            name={def.name}
            need={material.need}
            have={material.have}
            ok={material.ok}
            onEnter={(element) => onShowTooltip?.(element, stack)}
            onLeave={onHideTooltip}
          />
        );
      })}
    </ul>
  );
}

interface RowProps {
  icon: ReactNode;
  name: string;
  need: number;
  have: number;
  ok: boolean;
  onEnter?: (element: HTMLElement) => void;
  onLeave?: () => void;
}

function CostRow({ icon, name, need, have, ok, onEnter, onLeave }: RowProps) {
  const interactive = Boolean(onEnter);
  return (
    <li
      className={s.row}
      data-ok={ok}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`${name}，需要 ${need}，持有 ${have}${ok ? "" : "，数量不足"}`}
      onPointerEnter={(event) => onEnter?.(event.currentTarget)}
      onPointerLeave={onLeave}
      onFocus={(event) => onEnter?.(event.currentTarget)}
      onBlur={onLeave}
    >
      <span className={s.icon} aria-hidden="true">{icon}</span>
      <span className={s.name}>{name}</span>
      <span className={s.value} aria-hidden="true">
        <b>{need}</b>
        <i>/</i>
        <span className={s.haveLabel}>持有</span>
        <em>{have}</em>
      </span>
    </li>
  );
}
