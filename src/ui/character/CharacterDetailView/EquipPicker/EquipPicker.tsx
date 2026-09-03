import type { CSSProperties } from "react";
import { getItemDef } from "@/data";
import type { EquipSlot, ItemStack } from "@/items/types";
import { RARITY_LABEL, SLOT_LABEL } from "@/items/types";
import { useHoverTooltip } from "@/ui/common/HoverTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTooltip from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/cx";
import s from "./EquipPicker.module.css";

interface Props {
  slot: EquipSlot;
  candidates: ItemStack[];
  onEquip: (uid: string) => void;
  onClose: () => void;
  onHoverCandidate: (stack: ItemStack | null) => void;
  style?: CSSProperties;
}

export function EquipPicker({
  slot,
  candidates,
  onEquip,
  onClose,
  onHoverCandidate,
  style,
}: Props) {
  return (
    <section className={s.picker} style={style} aria-label={`${SLOT_LABEL[slot]}装备仓库`}>
      <header className={s.head}>
        <div>
          <span className={s.kicker}>装备配置 / 仓库</span>
          <h2 className={s.title}>仓库 · {SLOT_LABEL[slot]}</h2>
        </div>
        <button className={s.close} type="button" onClick={onClose} aria-label="关闭装备仓库">
          ×
        </button>
      </header>

      <div className={s.available}>
        <div className={s.availableHead}>
          <span className={s.label}>可用装备</span>
          <span className={s.count}>{candidates.length} 件</span>
        </div>
        {candidates.length > 0 ? (
          <div className={s.grid}>
            {candidates.map((stack) => (
              <EquipCandidate
                key={stack.uid}
                stack={stack}
                onEquip={onEquip}
                onHoverCandidate={onHoverCandidate}
              />
            ))}
          </div>
        ) : (
          <p className={s.emptyText}>仓库中暂无可用的{SLOT_LABEL[slot]}。</p>
        )}
      </div>

      <p className={s.footer}>悬浮查看更换后的属性变化</p>
    </section>
  );
}

function EquipCandidate({
  stack,
  onEquip,
  onHoverCandidate,
}: {
  stack: ItemStack;
  onEquip: (uid: string) => void;
  onHoverCandidate: (stack: ItemStack | null) => void;
}) {
  const { point, bind } = useHoverTooltip();
  const def = getItemDef(stack.itemId);
  return (
    <div
      className={cx(s.candidate, s[`r-${def.rarity}`])}
      tabIndex={0}
      {...bind}
      onPointerEnter={(event) => {
        bind.onPointerEnter(event);
        onHoverCandidate(stack);
      }}
      onPointerLeave={() => {
        bind.onPointerLeave();
        onHoverCandidate(null);
      }}
      onFocus={(event) => {
        bind.onFocus(event);
        onHoverCandidate(stack);
      }}
      onBlur={() => {
        bind.onBlur();
        onHoverCandidate(null);
      }}
    >
      <ItemSlot
        stack={stack}
        showName={false}
        className={s.candidateSlot}
        aria-label={`穿戴${def.name}`}
        onClick={() => onEquip(stack.uid)}
      />
      <span className={s.candidateName}>{def.name}</span>
      <span className={s.candidateRarity}>{RARITY_LABEL[def.rarity]}</span>
      {point && <ItemTooltip stack={stack} point={point} />}
    </div>
  );
}