// 定向重铸的系别选择: 「不限」= 全池随机, 选定系别 = 只在该系别 3 条里重掷(价格翻倍)。
// 据点工房的重铸与探索中的重铸台共用。

import { BOND_FAMILIES, type BondFamily } from "@/data";
import { cx } from "@/ui/common/shared/cx";
import s from "./BondFamilyPicker.module.css";

interface Props {
  value: BondFamily | null;
  disabled?: boolean;
  onChange: (family: BondFamily | null) => void;
}

export function BondFamilyPicker({ value, disabled = false, onChange }: Props) {
  const options: { id: BondFamily | null; label: string }[] = [
    { id: null, label: "不限" },
    ...BOND_FAMILIES.map((family) => ({ id: family.id, label: family.name })),
  ];
  return (
    <div className={s.picker} role="radiogroup" aria-label="定向系别">
      <span className={s.label}>定向系别</span>
      <div className={s.chips}>
        {options.map((option) => (
          <button
            key={option.id ?? "any"}
            type="button"
            role="radio"
            aria-checked={value === option.id}
            disabled={disabled}
            className={cx(s.chip, value === option.id && s.active)}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <span className={s.hint}>{value ? "只在该系别内重掷，消耗翻倍" : "全部羁绊中随机重掷"}</span>
    </div>
  );
}
