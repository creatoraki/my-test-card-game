// 主分区页眉上的「待装备」提示: 背包里点「装备」带进来的那件 + 取消。
// 穿上后它离开背包, 调用方查不到 stack 就不再渲染本组件。
import { getItemDef } from "@/data";
import { SLOT_LABEL, type ItemStack } from "@/items/types";
import ItemIconFrame from "@/ui/common/item/ItemIconFrame";
import s from "./PendingChip.module.css";

export function PendingChip({ stack, onCancel }: { stack: ItemStack; onCancel: () => void }) {
  const def = getItemDef(stack.itemId);
  return (
    <div className={s.chip}>
      <span className={s.label}>待装备</span>
      <ItemIconFrame itemId={stack.itemId} size="sm" />
      <span className={s.name}>
        {def.name}
        {def.slot && <i> · {SLOT_LABEL[def.slot]}</i>}
      </span>
      <button type="button" className={s.cancel} onClick={onCancel}>
        取消
      </button>
    </div>
  );
}
