// 制造清单里的一张配方卡: 模组图标 / 名称 / 效果 / 可制造状态 / 编号条码装饰。
import { getItemDef, type CraftCheck } from "@/data";
import { itemIcon } from "@/ui/art/items/itemArt";
import { craftStatusLabel } from "./craftStatus";
import s from "./RecipeCard.module.css";

interface Props {
  itemId: string;
  /** 在清单中的序号, 从 1 开始。 */
  order: number;
  check: CraftCheck | undefined;
  selected: boolean;
  onSelect: () => void;
}

export function RecipeCard({ itemId, order, check, selected, onSelect }: Props) {
  const def = getItemDef(itemId);
  const status = craftStatusLabel(check);
  return (
    <button
      className={s.card}
      type="button"
      data-selected={selected || undefined}
      aria-pressed={selected}
      aria-label={`选择${def.name}，${status}`}
      onClick={onSelect}
    >
      <span className={s.icon} aria-hidden="true">{itemIcon(def)}</span>
      <strong className={s.name}>{def.name}</strong>
      <span className={s.desc}>{def.desc}</span>
      <span className={s.rule} aria-hidden="true" />
      <span className={s.tag} data-ok={check?.ok ?? false} aria-hidden="true">
        <span className={s.tagInner}>{status}</span>
      </span>
      <span className={s.foot} aria-hidden="true">
        <span className={s.serial}>
          {String(order).padStart(2, "0")}
          <br />
          MODULE
        </span>
        <span className={s.barcode} />
      </span>
    </button>
  );
}
