import { useState } from "react";
import type { EquipSlot, ItemStack } from "@/items/types";
import { SLOT_LABEL } from "@/items/types";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./EquipmentDrawer.module.css";

interface Props {
  slot: EquipSlot;
  current: ItemStack | null;
  candidates: ItemStack[];
  onEquip: (uid: string) => void;
  onUnequip: () => void;
  onClose: () => void;
}

export function EquipmentDrawer({
  slot,
  current,
  candidates,
  onEquip,
  onUnequip,
  onClose,
}: Props) {
  const [hoveredCandidateUid, setHoveredCandidateUid] = useState<string | null>(null);
  const hoveredCandidate = candidates.find((stack) => stack.uid === hoveredCandidateUid) ?? null;
  const detailStack = hoveredCandidate ?? current;

  return (
    <section className={s["equipment-drawer"]} aria-label={`${SLOT_LABEL[slot]}仓库`}>
      <header className={s["equipment-drawer-head"]}>
        <div>
          <span className={s["equipment-drawer-kicker"]}>LOADOUT / WAREHOUSE</span>
          <h3 className={s["equipment-drawer-title"]}>仓库 · {SLOT_LABEL[slot]}</h3>
          <p className={s["equipment-drawer-sub"]}>点击物品立即更换当前部位</p>
        </div>
        <button className={s["equipment-drawer-close"]} type="button" onClick={onClose} aria-label="关闭装备仓库">
          ×
        </button>
      </header>

      <div className={s["equipment-drawer-body"]}>
        <div className={s["equipment-candidates"]}>
          <div className={s["equipment-candidates-head"]}>
            <span className={s["equipment-drawer-label"]}>可用装备</span>
            <span className={s["equipment-drawer-count"]}>{candidates.length} 件</span>
          </div>
          {candidates.length > 0 ? (
            <div className={s["equipment-candidates-grid"]}>
              {candidates.map((stack) => (
                <div
                  className={s["equipment-candidate"]}
                  key={stack.uid}
                  onMouseEnter={() => setHoveredCandidateUid(stack.uid)}
                  onMouseLeave={() =>
                    setHoveredCandidateUid((uid) => (uid === stack.uid ? null : uid))
                  }
                  onFocus={() => setHoveredCandidateUid(stack.uid)}
                  onBlur={() =>
                    setHoveredCandidateUid((uid) => (uid === stack.uid ? null : uid))
                  }
                >
                  <ItemSlot
                    stack={stack}
                    className={s["equipment-candidate-slot"]}
                    onClick={() => onEquip(stack.uid)}
                  />
                  <span className={s["equipment-candidate-action"]}>点击穿戴</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={s["equipment-empty"]}>仓库中暂无可用的{SLOT_LABEL[slot]}。</p>
          )}
        </div>

        <aside className={s["equipment-current"]}>
          <span className={s["equipment-drawer-label"]}>当前装备</span>
          <ItemDetail
            stack={detailStack}
            className={s["equipment-current-detail"]}
            placeholder={`当前没有装备${SLOT_LABEL[slot]}`}
          >
            <button className={cx(s["equipment-action"], s["is-danger"])} type="button" onClick={onUnequip}>
              卸下当前装备
            </button>
          </ItemDetail>
        </aside>
      </div>
    </section>
  );
}
