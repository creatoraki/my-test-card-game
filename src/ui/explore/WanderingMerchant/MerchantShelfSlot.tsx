import { getCharacter, getItemDef, makeCard } from "@/data";
import type { MerchantSlot } from "@/data/curios/types";
import { HandCard } from "@/ui/battle/HandCard";
import ItemSlot from "@/ui/common/item/ItemSlot";
import s from "./WanderingMerchantPanel.module.css";

export function MerchantShelfSlot({
  slot,
  selected,
  onClick,
}: {
  slot: MerchantSlot;
  selected: boolean;
  onClick: () => void;
}) {
  const product = slot.kind === "card" ? getCharacter(slot.charId).name : getItemDef(slot.stack.itemId).name;
  return <div
    className={`${s.slot} ${selected ? s.slotSelected : ""} ${slot.sold ? s.slotSold : ""}`}
    role="button"
    tabIndex={slot.sold ? -1 : 0}
    aria-disabled={slot.sold}
    aria-label={`${product}${slot.sold ? "，已售出" : ""}`}
    onClick={() => !slot.sold && onClick()}
    onKeyDown={(event) => { if (!slot.sold && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onClick(); } }}
  >
    <div className={s.slotVisual}>
      {slot.kind === "card"
        ? <HandCard card={makeCard(slot.cardDefId)} variant="pile" playable selected={selected} />
        : <ItemSlot stack={slot.stack} showName={false} disabled={slot.sold} />}
    </div>
    <span className={s.slotName}>{slot.kind === "card" ? "角色卡牌" : product}</span>
    {slot.sold && <span className={s.soldMark}>已售出</span>}
  </div>;
}
