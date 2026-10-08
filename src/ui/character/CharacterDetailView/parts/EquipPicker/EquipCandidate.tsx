import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTooltip from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/shared/cx";
import { useHoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import s from "./EquipPicker.module.css";

/** 悬浮联动: kin = 与正在悬浮的那件同羁绊(提亮), dim = 不同羁绊(压暗)。 */
export type CandidateLink = "kin" | "dim" | null;

export function EquipCandidate({
  stack,
  link,
  onEquip,
  onHover,
}: {
  stack: ItemStack;
  link: CandidateLink;
  onEquip: (uid: string) => void;
  onHover: (stack: ItemStack | null) => void;
}) {
  const { point, bind } = useHoverTooltip();
  const def = getItemDef(stack.itemId);
  return (
    <div
      className={cx(s.candidate, link === "kin" && s.isKin, link === "dim" && s.isDim)}
      tabIndex={0}
      {...bind}
      onPointerEnter={(event) => {
        bind.onPointerEnter(event);
        onHover(stack);
      }}
      onPointerLeave={() => {
        bind.onPointerLeave();
        onHover(null);
      }}
      onFocus={(event) => {
        bind.onFocus(event);
        onHover(stack);
      }}
      onBlur={() => {
        bind.onBlur();
        onHover(null);
      }}
    >
      <ItemSlot
        stack={stack}
        showName={false}
        className={s.candidateSlot}
        aria-label={`穿戴${def.name}`}
        onClick={() => onEquip(stack.uid)}
      />
      {point && <ItemTooltip stack={stack} point={point} />}
    </div>
  );
}
