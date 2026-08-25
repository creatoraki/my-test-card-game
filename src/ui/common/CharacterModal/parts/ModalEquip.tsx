// 档案右栏上半: 三个装备槽 + (仅探索)可换装的背包候选列。
//
// ★ 规则一概不在这里: 能不能换、换完谁进背包, 全由调用方的 swap 回调决定。
//   swap 缺省 = 只读(战斗界面就是这么用的), 槽位不再是按钮, 也不渲染候选列。

import { useState } from "react";
import { getItemDef } from "@/data";
import { SLOT_LABEL, type EquipSlot, type ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
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
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

const SLOTS: EquipSlot[] = ["weapon", "armor", "trinket"];

export function ModalEquip({ equipped, swap, onShowTooltip, onHideTooltip }: Props) {
  // 选中的部位只做候选列过滤, 不承载任何状态含义 —— 再点一次即取消, 回到"全部装备"。
  const [activeSlot, setActiveSlot] = useState<EquipSlot | null>(null);
  const locked = Boolean(swap?.disabledReason);
  const candidates = (swap?.candidates ?? []).filter((stack) => {
    const def = getItemDef(stack.itemId);
    return !activeSlot || def.slot === activeSlot;
  });

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
          const active = activeSlot === slot;
          return (
            <div key={slot} className={cx(s["cm-slot"], active && s["is-active"])}>
              <span className={s["cm-slot-label"]}>{SLOT_LABEL[slot]}</span>
              {stack ? (
                <div
                  className={s["cm-slot-box"]}
                  onMouseEnter={(event) => onShowTooltip(event.currentTarget, stack)}
                  onMouseLeave={onHideTooltip}
                >
                  <ItemSlot
                    stack={stack}
                    selected={active}
                    aria-label={`${SLOT_LABEL[slot]}：${getItemDef(stack.itemId).name}`}
                    onClick={swap ? () => setActiveSlot(active ? null : slot) : undefined}
                    className={s["cm-slot-item"]}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className={s["cm-slot-empty"]}
                  disabled={!swap}
                  aria-label={`${SLOT_LABEL[slot]}：空槽`}
                  onClick={swap ? () => setActiveSlot(active ? null : slot) : undefined}
                >
                  空
                </button>
              )}
              {swap && stack && (
                <button
                  type="button"
                  className={s["cm-slot-off"]}
                  disabled={locked}
                  onClick={() => swap.onUnequip(slot)}
                >
                  卸下
                </button>
              )}
            </div>
          );
        })}
      </div>

      {swap && (
        <div className={s["cm-candidates"]}>
          {candidates.length === 0 ? (
            <p className={s["cm-empty-text"]}>
              {activeSlot ? `背包里没有可用的${SLOT_LABEL[activeSlot]}` : "背包里没有装备"}
            </p>
          ) : (
            <div className={s["cm-candidate-grid"]}>
              {candidates.map((stack) => (
                <div
                  key={stack.uid}
                  className={s["cm-candidate"]}
                  onMouseEnter={(event) => onShowTooltip(event.currentTarget, stack)}
                  onMouseLeave={onHideTooltip}
                >
                  <ItemSlot
                    stack={stack}
                    disabled={locked}
                    aria-label={`穿戴 ${getItemDef(stack.itemId).name}`}
                    onClick={() => {
                      onHideTooltip();
                      swap.onEquip(stack.uid);
                    }}
                    className={s["cm-candidate-item"]}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
