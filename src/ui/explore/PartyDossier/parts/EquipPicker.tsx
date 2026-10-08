// 装备大卡点开的背包候选浮层: 挂到设计画布上, 优先落在锚点下方, 放不下就翻到上方。
// ★ 规则不在这里: 能不能换由 PartyDossier 给出 lockedReason, 换装回调直达 runStore。
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { getItemDef } from "@/data";
import { GEAR_SLOT_KIND, GEAR_SLOT_LABEL, type GearSlot } from "@/items/gearSlots";
import { SLOT_LABEL, type ItemStack } from "@/items/types";
import { designScaleOf, stageHostOf } from "@/ui/app/shared/stage";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/shared/cx";
import { ARCHIVE_ACCENT } from "../partyDossierTheme";
import s from "./EquipPicker.module.css";

const GAP = 10;
const MARGIN = 12;

interface Props {
  slot: GearSlot;
  anchor: HTMLElement;
  /** 背包里该部位的候选装备。 */
  candidates: ItemStack[];
  hasEquipped: boolean;
  lockedReason?: string;
  onEquip: (uid: string) => void;
  onUnequip: () => void;
  onHoverCandidate: (element: HTMLElement | null, stack: ItemStack | null) => void;
  onClose: () => void;
}

function usePlacement(anchor: HTMLElement, ref: RefObject<HTMLElement | null>) {
  const host = stageHostOf(anchor);
  const [placed, setPlaced] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const picker = ref.current;
    if (!picker) return;
    const hostRect = host.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const k = designScaleOf(host);
    const width = picker.getBoundingClientRect().width / k;
    const height = picker.getBoundingClientRect().height / k;
    const anchorLeft = (anchorRect.left - hostRect.left) / k;
    const anchorRight = (anchorRect.right - hostRect.left) / k;
    const anchorTop = (anchorRect.top - hostRect.top) / k;
    const anchorBottom = (anchorRect.bottom - hostRect.top) / k;
    const wantedLeft = (anchorLeft + anchorRight) / 2 - width / 2;
    const left = Math.min(Math.max(MARGIN, wantedLeft), Math.max(MARGIN, host.clientWidth - width - MARGIN));
    const below = anchorBottom + GAP;
    const wantedTop = below + height <= host.clientHeight - MARGIN ? below : anchorTop - height - GAP;
    const top = Math.min(Math.max(MARGIN, wantedTop), Math.max(MARGIN, host.clientHeight - height - MARGIN));
    setPlaced({ left, top });
  }, [anchor, host, ref]);

  return { host, placed, maxHeight: Math.max(0, host.clientHeight - MARGIN * 2) };
}

export function EquipPicker({
  slot,
  anchor,
  candidates,
  hasEquipped,
  lockedReason,
  onEquip,
  onUnequip,
  onHoverCandidate,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { host, placed, maxHeight } = usePlacement(anchor, ref);
  const locked = Boolean(lockedReason);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!ref.current?.contains(target) && !anchor.contains(target)) onClose();
    };
    // ⚠ 捕获阶段拦下 Esc: 只收起候选, 不让外层档案跟着关掉。
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    };
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onMouseDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [anchor, onClose]);

  const style = {
    left: `${placed?.left ?? 0}px`,
    top: `${placed?.top ?? 0}px`,
    "--k": ARCHIVE_ACCENT,
    "--picker-max-h": `${maxHeight}px`,
    visibility: placed ? undefined : "hidden",
  } as CSSProperties;

  return createPortal(
    <div ref={ref} className={s.picker} style={style} role="dialog" aria-label={`更换${GEAR_SLOT_LABEL[slot]}`}>
      <div className={s.head}>
        <span className={s.title}>更换{GEAR_SLOT_LABEL[slot]}</span>
        <span className={cx(s.note, locked && s.warn)}>{lockedReason ?? `背包候选 ${candidates.length} 件`}</span>
      </div>

      {candidates.length === 0 ? (
        <p className={s.empty}>背包里没有可用的{SLOT_LABEL[GEAR_SLOT_KIND[slot]]}</p>
      ) : (
        <div className={s.grid}>
          {candidates.map((stack) => (
            <div
              key={stack.uid}
              className={s.candidate}
              onMouseEnter={(event) => onHoverCandidate(event.currentTarget, stack)}
              onMouseLeave={() => onHoverCandidate(null, null)}
            >
              <ItemSlot
                stack={stack}
                disabled={locked}
                aria-label={`换上${getItemDef(stack.itemId).name}`}
                onClick={() => {
                  onHoverCandidate(null, null);
                  onEquip(stack.uid);
                  onClose();
                }}
                className={s.item}
              />
            </div>
          ))}
        </div>
      )}

      {hasEquipped && (
        <button
          type="button"
          className={s.off}
          disabled={locked}
          onClick={() => {
            onUnequip();
            onClose();
          }}
        >
          卸下当前{GEAR_SLOT_LABEL[slot]}
        </button>
      )}
    </div>,
    host,
  );
}
