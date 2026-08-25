import type { Card } from "@/engine";
import type { ItemStack } from "@/items/types";
import { canEquipModule, getItemDef } from "@/data";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./AssemblyModuleRack.module.css";

interface Props {
  card?: Card;
  moduleStacks: ItemStack[];
  selectedModuleUid: string | null;
  onSelect: (uid: string) => void;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

export function AssemblyModuleRack({
  card,
  moduleStacks,
  selectedModuleUid,
  onSelect,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  return (
    <aside className={s.rack} aria-label="仓库模组">
      <div className={s.heading}>
        <span className={s.kicker}>MODULE RACK</span>
        <span className={s.count}>{moduleStacks.length} 件</span>
      </div>
      {moduleStacks.length ? (
        <div className={s.grid}>
          {moduleStacks.map((stack) => {
            const compatible = Boolean(card && canEquipModule(card, stack.itemId));
            const selected = stack.uid === selectedModuleUid;
            return (
              <div
                key={stack.uid}
                className={cx(s.option, !compatible && s.incompatible, selected && s.selected)}
                data-compatible={compatible}
                onPointerEnter={(event) => onShowTooltip(event, stack)}
                onPointerLeave={onHideTooltip}
                onFocus={(event) => onShowTooltip(event.currentTarget, stack)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onHideTooltip();
                }}
              >
                <ItemSlot
                  stack={stack}
                  showName={false}
                  selected={selected}
                  aria-label={`${getItemDef(stack.itemId).name}${compatible ? "，可装配" : "，查看不匹配原因"}`}
                  onClick={() => onSelect(stack.uid)}
                  className={s.slot}
                />
                <span className={s.compatibility} aria-hidden="true">
                  {compatible ? "可用" : "不匹配"}
                </span>
                {!compatible && (
                  <span className={s.srOnly}>{`${getItemDef(stack.itemId).name}暂不适用于当前卡牌`}</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={s.empty}>
          <span className={s.emptySlot} aria-hidden="true" />
          <span>仓库暂无模组</span>
        </div>
      )}
    </aside>
  );
}