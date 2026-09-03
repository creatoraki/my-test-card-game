import type { CSSProperties } from "react";
import { getItemDef } from "@/data";
import type { EquipSlot, ItemStack } from "@/items/types";
import { RARITY_LABEL, SLOT_LABEL } from "@/items/types";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import type { CharacterState } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { EquipCompareTip } from "./EquipCompareTip";
import s from "./EquipPicker.module.css";

interface Props {
  slot: EquipSlot;
  current: ItemStack | null;
  candidates: ItemStack[];
  character: CharacterState;
  onEquip: (uid: string) => void;
  onUnequip: () => void;
  onClose: () => void;
  onHoverCandidate: (stack: ItemStack | null) => void;
  style?: CSSProperties;
}

export function EquipPicker({
  slot,
  current,
  candidates,
  character,
  onEquip,
  onUnequip,
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

      <div className={s.currentRow}>
        <div className={s.currentItem}>
          <span className={s.label}>当前装备</span>
          <div className={s.currentContent}>
            {current ? <ItemSlot stack={current} className={s.currentSlot} /> : <span className={s.empty}>空槽</span>}
            <strong className={s.currentName}>{current ? getItemDef(current.itemId).name : "未装备"}</strong>
          </div>
        </div>
        <button className={s.unequip} type="button" disabled={!current} onClick={onUnequip}>
          卸下
        </button>
      </div>

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
                current={current}
                character={character}
                slot={slot}
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
  current,
  character,
  slot,
  onEquip,
  onHoverCandidate,
}: {
  stack: ItemStack;
  current: ItemStack | null;
  character: CharacterState;
  slot: EquipSlot;
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
        className={s.candidateSlot}
        aria-label={`穿戴${def.name}`}
        onClick={() => onEquip(stack.uid)}
      />
      <span className={s.candidateName}>{def.name}</span>
      <span className={s.candidateRarity}>{RARITY_LABEL[def.rarity]}</span>
      {point && (
        <HoverTooltip point={point}>
          <EquipCompareTip character={character} slot={slot} current={current} candidate={stack} />
        </HoverTooltip>
      )}
    </div>
  );
}