import { getItemDef } from "@/data";
import type { StatBlock } from "@/engine";
import type { EquipSlot, ItemRarity, ItemStack } from "@/items/types";
import { RARITY_LABEL } from "@/items/types";
import type { CharacterState } from "@/store/townStore";
import { STAT_LABEL } from "@/ui/common/item/ItemDetail";
import { isPercentStat } from "@/ui/common/statGroups";
import { previewStatsWith, statDeltas } from "../equipPreview";
import s from "./EquipPicker.module.css";

export function EquipCompareTip({
  character,
  slot,
  current,
  candidate,
}: {
  character: CharacterState;
  slot: EquipSlot;
  current: ItemStack | null;
  candidate: ItemStack;
}) {
  const from = previewStatsWith(character, slot, current);
  const to = previewStatsWith(character, slot, candidate);
  const deltas = statDeltas(from, to);
  const currentDef = current ? getItemDef(current.itemId) : null;
  const candidateDef = getItemDef(candidate.itemId);

  return (
    <div className={s.compare}>
      <div className={s.compareHead}>
        <CompareName label="当前" name={currentDef?.name ?? "空槽"} rarity={currentDef?.rarity} />
        <CompareName label="更换后" name={candidateDef.name} rarity={candidateDef.rarity} />
      </div>
      {deltas.length > 0 ? (
        <div className={s.compareRows}>
          <div className={s.compareLabels}>
            <span>属性</span><span>当前值</span><span>→ 新值</span>
          </div>
          {deltas.map(({ key, from: fromValue, to: toValue, delta }) => (
            <div className={s.compareRow} key={key}>
              <span>{STAT_LABEL[key] ?? key}</span>
              <span>{formatStat(fromValue, key)}</span>
              <strong className={delta > 0 ? s["is-up"] : s["is-down"]}>
                {formatStat(toValue, key)} <small>{delta > 0 ? "+" : ""}{formatStat(delta, key)}</small>
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p className={s.noChange}>面板属性无变化</p>
      )}
    </div>
  );
}

function CompareName({ label, name, rarity }: { label: string; name: string; rarity?: ItemRarity }) {
  return (
    <div className={s.compareName}>
      <span>{label}</span>
      <strong className={rarity ? s[`r-${rarity}`] : undefined}>{name}</strong>
      {rarity && <small className={rarity ? s[`r-${rarity}`] : undefined}>{RARITY_LABEL[rarity]}</small>}
    </div>
  );
}

function formatStat(value: number, key: keyof StatBlock): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}${isPercentStat(key) ? "%" : ""}`;
}