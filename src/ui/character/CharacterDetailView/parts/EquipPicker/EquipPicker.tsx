import { useMemo, useState, type CSSProperties } from "react";
import { GEAR_SLOT_KIND, GEAR_SLOT_LABEL, type GearSlot } from "@/items/gearSlots";
import type { ItemStack } from "@/items/types";
import { SLOT_LABEL } from "@/items/types";
import { stackBond } from "@/ui/common/bond/stackBond";
import { BondFilterBar, NO_BOND, type BondFilterOption } from "./BondFilterBar";
import { EquipCandidate, type CandidateLink } from "./EquipCandidate";
import s from "./EquipPicker.module.css";

interface Props {
  slot: GearSlot;
  candidates: ItemStack[];
  onEquip: (uid: string) => void;
  onClose: () => void;
  onHoverCandidate: (stack: ItemStack | null) => void;
  style?: CSSProperties;
}

const bondKey = (stack: ItemStack) => stackBond(stack)?.id ?? NO_BOND;

export function EquipPicker({
  slot,
  candidates,
  onEquip,
  onClose,
  onHoverCandidate,
  style,
}: Props) {
  // 筛选跟着格子走: 换一个装备格就回到「全部」。
  const [filter, setFilter] = useState<{ slot: GearSlot; bondId: string | null }>({ slot, bondId: null });
  const [hovered, setHovered] = useState<ItemStack | null>(null);

  const options = useMemo<BondFilterOption[]>(() => {
    const map = new Map<string, BondFilterOption>();
    for (const stack of candidates) {
      const def = stackBond(stack);
      const id = def?.id ?? NO_BOND;
      const entry = map.get(id) ?? { id, def, count: 0 };
      entry.count += 1;
      map.set(id, entry);
    }
    // 有羁绊的按件数从多到少, 「无羁绊」垫底。
    return [...map.values()].sort((a, b) => Number(!a.def) - Number(!b.def) || b.count - a.count);
  }, [candidates]);

  // 选中的羁绊被穿走到一件不剩时自动回到「全部」。
  const bondId = filter.slot === slot && options.some((o) => o.id === filter.bondId) ? filter.bondId : null;
  const shown = bondId ? candidates.filter((stack) => bondKey(stack) === bondId) : candidates;

  // 点击穿戴后那件会直接从列表消失、收不到离开事件, 只认仍在列表里的悬浮项。
  const live = hovered && shown.some((stack) => stack.uid === hovered.uid) ? hovered : null;
  const hoveredBond = live ? stackBond(live)?.id : undefined;
  const linkOf = (stack: ItemStack): CandidateLink => {
    if (!live || !hoveredBond || stack.uid === live.uid) return null;
    return bondKey(stack) === hoveredBond ? "kin" : "dim";
  };

  return (
    <section className={s.picker} style={style} aria-label={`${GEAR_SLOT_LABEL[slot]}装备仓库`}>
      <header className={s.head}>
        <div>
          <span className={s.kicker}>装备配置 / 仓库</span>
          <h2 className={s.title}>仓库 · {GEAR_SLOT_LABEL[slot]}</h2>
        </div>
        <button className={s.close} type="button" onClick={onClose} aria-label="关闭装备仓库">
          ×
        </button>
      </header>

      <div className={s.available}>
        <div className={s.availableHead}>
          <span className={s.label}>可用装备</span>
          <span className={s.count}>{shown.length} 件</span>
        </div>
        {candidates.length > 0 && (
          <BondFilterBar
            options={options}
            total={candidates.length}
            value={bondId}
            onChange={(id) => setFilter({ slot, bondId: id })}
          />
        )}
        {candidates.length > 0 ? (
          <div className={s.grid}>
            {shown.map((stack) => (
              <EquipCandidate
                key={stack.uid}
                stack={stack}
                link={linkOf(stack)}
                onEquip={onEquip}
                onHover={(next) => {
                  setHovered(next);
                  onHoverCandidate(next);
                }}
              />
            ))}
          </div>
        ) : (
          <p className={s.emptyText}>仓库中暂无可用的{SLOT_LABEL[GEAR_SLOT_KIND[slot]]}。</p>
        )}
      </div>

      <p className={s.footer}>悬浮查看更换后的属性变化，同羁绊装备会一起亮起</p>
    </section>
  );
}
