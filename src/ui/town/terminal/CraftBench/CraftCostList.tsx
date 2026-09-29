import type { ReactNode } from "react";
import { getItemDef, type CraftCheck, type ModuleRecipe } from "@/data";
import { itemIcon } from "@/ui/art/items/itemArt";
import { ExpIcon } from "./craftIcons";
import s from "./CraftCostList.module.css";

interface Props {
  recipe: ModuleRecipe;
  check: CraftCheck | null;
  /** 制造者当前的可用经验池。 */
  exp: number;
}

/** 所需材料清单: 首行经验, 其后逐行材料; 每行「持有 / 需求 + 足够 or 缺 N」, 足够走青绿、不足走琥珀。 */
export function CraftCostList({ recipe, check, exp }: Props) {
  return (
    <ul className={s.list}>
      <CostRow icon={<ExpIcon />} name="经验" need={recipe.exp} have={exp} ok={check?.expOk ?? false} />
      {check?.materials.map((material) => {
        const def = getItemDef(material.itemId);
        return (
          <CostRow
            key={material.itemId}
            icon={itemIcon(def)}
            name={def.name}
            need={material.need}
            have={material.have}
            ok={material.ok}
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
}

function CostRow({ icon, name, need, have, ok }: RowProps) {
  const lack = Math.max(need - have, 0);
  return (
    <li className={s.row} data-ok={ok} aria-label={`${name}，持有 ${have}，需要 ${need}${ok ? "，数量足够" : `，还缺 ${lack}`}`}>
      <span className={s.icon} aria-hidden="true">{icon}</span>
      <span className={s.name}>{name}</span>
      <span className={s.value} aria-hidden="true">
        <em>{have}</em>
        <i>/</i>
        <b>{need}</b>
      </span>
      <span className={s.badge} aria-hidden="true">
        {ok ? "足够" : `缺 ${lack}`}
      </span>
    </li>
  );
}
