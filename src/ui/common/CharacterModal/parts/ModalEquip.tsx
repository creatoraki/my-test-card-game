// 档案中栏上半: 三个装备槽 + (仅探索)点击后打开的背包候选浮层。
//
// ★ 规则一概不在这里: 能不能换、换完谁进背包, 全由调用方的 swap 回调决定。
//   swap 缺省 = 只读(战斗界面就是这么用的), 槽位不再是按钮, 也不渲染候选列。

import { useState } from "react";
import { getItemDef } from "@/data";
import { SLOT_LABEL, type EquipSlot, type ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import { ModalEquipPicker } from "./ModalEquipPicker";
import s from "../CharacterModal.module.css";

export interface EquipSwap {
  /** 背包里的装备(调用方已按 category==="equipment" 过滤)。 */
  candidates: ItemStack[];
  /** 非空 = 本阶段不允许换装, 按钮全禁用并展示这句话。 */
  disabledReason?: string;
  onEquip: (uid: string) => void;
  onUnequip: (slot: EquipSlot) => void;
}

interface Props {
  equipped: Record<EquipSlot, ItemStack | null>;
  swap?: EquipSwap;
  accent: string;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

const SLOTS: EquipSlot[] = ["weapon", "armor", "trinket"];

export function ModalEquip({ equipped, swap, accent, onShowTooltip, onHideTooltip }: Props) {
  const [openSlot, setOpenSlot] = useState<{ slot: EquipSlot; anchor: HTMLElement } | null>(null);
  const locked = Boolean(swap?.disabledReason);

  const closePicker = () => {
    onHideTooltip();
    setOpenSlot(null);
  };

  const togglePicker = (slot: EquipSlot, anchor: HTMLElement) => {
    onHideTooltip();
    setOpenSlot((current) => (current?.slot === slot ? null : { slot, anchor }));
  };

  return (
    <div className={s["cm-equip"]}>
      <div className={s["cm-block-head"]}>
        <span className={s["cm-block-title"]}>装备</span>
        {swap ? (
          <span className={cx(s["cm-block-note"], locked && s["is-warn"])}>
            {swap.disabledReason ?? `背包候选 ${swap.candidates.length} 件`}
          </span>
        ) : (
          <span className={s["cm-block-note"]}>战斗中不可更换</span>
        )}
      </div>

      <div className={s["cm-slot-row"]}>
        {SLOTS.map((slot) => {
          const stack = equipped[slot];
          const active = openSlot?.slot === slot;
          return (
            <div key={slot} className={cx(s["cm-slot"], active && s["is-active"])}>
              <span className={s["cm-slot-label"]}>{SLOT_LABEL[slot]}</span>
              {stack ? (
                <div
                  className={s["cm-slot-box"]}
                  onMouseEnter={(event) => {
                    if (!active) onShowTooltip(event.currentTarget, stack);
                  }}
                  onMouseLeave={onHideTooltip}
                >
                  <ItemSlot
                    stack={stack}
                    selected={active}
                    disabled={!swap}
                    aria-label={`${SLOT_LABEL[slot]}：${getItemDef(stack.itemId).name}`}
                    onClick={swap ? (event) => togglePicker(slot, event.currentTarget) : undefined}
                    className={s["cm-slot-item"]}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className={s["cm-slot-empty"]}
                  disabled={!swap}
                  aria-label={`${SLOT_LABEL[slot]}：空槽`}
                  onClick={swap ? (event) => togglePicker(slot, event.currentTarget) : undefined}
                >
                  空
                </button>
              )}
            </div>
          );
        })}
      </div>

      {swap && openSlot && (
        <ModalEquipPicker
          slot={openSlot.slot}
          anchor={openSlot.anchor}
          equipped={equipped[openSlot.slot]}
          swap={swap}
          accent={accent}
          onShowTooltip={onShowTooltip}
          onHideTooltip={onHideTooltip}
          onClose={closePicker}
        />
      )}
    </div>
  );
}
