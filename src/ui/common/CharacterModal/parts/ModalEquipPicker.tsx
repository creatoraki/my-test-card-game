import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { getItemDef } from "@/data";
import { SLOT_LABEL, type EquipSlot, type ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { designScaleOf, stageHostOf } from "@/ui/hooks/stage";
import type { EquipSwap } from "./ModalEquip";
import s from "./ModalEquipPicker.module.css";

const PICKER_GAP = 10;
const PICKER_MARGIN = 12;

interface Props {
  slot: EquipSlot;
  anchor: HTMLElement;
  equipped: ItemStack | null;
  swap: EquipSwap;
  accent: string;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
  onClose: () => void;
}

interface PickerPlacement {
  host: HTMLElement;
  left: number;
  top: number;
  maxHeight: number;
  ready: boolean;
}

function usePickerPlacement(anchor: HTMLElement, ref: React.RefObject<HTMLElement | null>): PickerPlacement {
  const host = stageHostOf(anchor);
  const [placed, setPlaced] = useState<{ left: number; top: number } | null>(null);
  const maxHeight = Math.max(0, host.clientHeight - PICKER_MARGIN * 2);

  useLayoutEffect(() => {
    const picker = ref.current;
    if (!picker) return;

    const hostRect = host.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const k = designScaleOf(host);
    const width = picker.getBoundingClientRect().width / k;
    const height = picker.getBoundingClientRect().height / k;
    const boxWidth = host.clientWidth;
    const boxHeight = host.clientHeight;
    const anchorLeft = (anchorRect.left - hostRect.left) / k;
    const anchorRight = (anchorRect.right - hostRect.left) / k;
    const anchorTop = (anchorRect.top - hostRect.top) / k;
    const anchorBottom = (anchorRect.bottom - hostRect.top) / k;
    const wantedLeft = (anchorLeft + anchorRight) / 2 - width / 2;
    const maxLeft = Math.max(PICKER_MARGIN, boxWidth - width - PICKER_MARGIN);
    const left = Math.min(Math.max(PICKER_MARGIN, wantedLeft), maxLeft);
    const below = anchorBottom + PICKER_GAP;
    const above = anchorTop - height - PICKER_GAP;
    const wantedTop = below + height <= boxHeight - PICKER_MARGIN ? below : above;
    const maxTop = Math.max(PICKER_MARGIN, boxHeight - height - PICKER_MARGIN);
    const top = Math.min(Math.max(PICKER_MARGIN, wantedTop), maxTop);

    setPlaced({ left, top });
  }, [anchor, host, ref]);

  return {
    host,
    left: placed?.left ?? 0,
    top: placed?.top ?? 0,
    maxHeight,
    ready: placed !== null,
  };
}

export function ModalEquipPicker({
  slot,
  anchor,
  equipped,
  swap,
  accent,
  onShowTooltip,
  onHideTooltip,
  onClose,
}: Props) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const placement = usePickerPlacement(anchor, pickerRef);
  const { host } = placement;
  const candidates = swap.candidates.filter((stack) => getItemDef(stack.itemId).slot === slot);
  const locked = Boolean(swap.disabledReason);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target) && !anchor.contains(target)) onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [anchor, onClose]);

  if (typeof document === "undefined") return null;

  const style = {
    "--asm-frame": accent,
    left: `${placement.left}px`,
    top: `${placement.top}px`,
    "--picker-max-h": `${placement.maxHeight}px`,
    visibility: placement.ready ? undefined : "hidden",
  } as CSSProperties;

  return createPortal(
    <div ref={pickerRef} className={s.picker} style={style} role="dialog" aria-label={`更换${SLOT_LABEL[slot]}`}>
      <div className={s.pickerHead}>
        <span className={s.pickerTitle}>更换{SLOT_LABEL[slot]}</span>
        <span className={cx(s.pickerNote, locked && s.isWarn)}>
          {swap.disabledReason ?? `候选 ${candidates.length} 件`}
        </span>
      </div>

      {candidates.length === 0 ? (
        <p className={s.emptyText}>背包里没有可用的{SLOT_LABEL[slot]}</p>
      ) : (
        <div className={s.candidateGrid}>
          {candidates.map((stack) => (
            <div
              key={stack.uid}
              className={s.candidate}
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
                  onClose();
                }}
                className={s.pickerItem}
              />
            </div>
          ))}
        </div>
      )}

      {equipped && (
        <button
          type="button"
          className={s.slotOff}
          disabled={locked}
          onClick={() => {
            swap.onUnequip(slot);
            onClose();
          }}
        >
          卸下当前
        </button>
      )}
    </div>,
    host,
  );
}
