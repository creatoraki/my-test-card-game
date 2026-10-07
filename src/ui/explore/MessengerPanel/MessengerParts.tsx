import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/items/itemArt";
import s from "./MessengerParts.module.css";

export function MessengerGlyph({ name, className }: { name: string; className?: string }) {
  return <svg className={className} aria-hidden="true"><use href={`#${name}`} /></svg>;
}

export function MessengerItemArt({ itemId }: { itemId: string }) {
  return <>{itemIcon(getItemDef(itemId))}</>;
}

export function MessengerSlot({ stack, selected = false, disabled = false, onClick }: {
  stack?: ItemStack; selected?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  if (!stack) return <div className={s.slot} aria-hidden="true">
    <MessengerGlyph name="背包格框" className={s.frame} />
    <MessengerGlyph name="空格十字" className={s.empty} />
  </div>;
  const name = getItemDef(stack.itemId).name;
  return <button type="button" className={`${s.slot} ${selected ? s.selected : ""}`}
    disabled={disabled} aria-pressed={selected} aria-label={`${name}，${stack.count} 件${selected ? "，已选择投递" : ""}`} onClick={onClick}>
    <MessengerGlyph name="背包格框" className={s.frame} />
    <span className={s.art}><MessengerItemArt itemId={stack.itemId} /></span>
    <span className={s.count}>{stack.count}</span>
  </button>;
}

export function MessengerFoodCard({ itemId, stack, count, blocked, canAdd, onChange }: {
  itemId: string; stack?: ItemStack; count: number; blocked: boolean;
  canAdd: boolean; onChange: (amount: number) => void;
}) {
  const name = getItemDef(itemId).name;
  return <div className={`${s.foodCard} ${blocked || !stack ? s.unavailable : ""} ${count > 0 ? s.paying : ""}`}>
    <MessengerGlyph name="支付卡框" className={s.frame} />
    <span className={s.foodArt}><MessengerItemArt itemId={itemId} /></span>
    <strong className={s.foodName}>{name}</strong>
    <div className={s.quantity}>
      <button type="button" data-step="subtract" disabled={count === 0} aria-label={`减少${name}支付数量`} onClick={() => onChange(-1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12H18" /></svg>
      </button>
      <span aria-live="polite">{count}</span>
      <button type="button" data-step="add" disabled={!canAdd} aria-label={`增加${name}支付数量`} onClick={() => onChange(1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12H18M12 6V18" /></svg>
      </button>
    </div>
    {(blocked || !stack) && <span className={s.reason}>{blocked ? "已选投递" : "暂无库存"}</span>}
  </div>;
}
