import type { ReactNode } from "react";
import s from "./QwenBorderGlowDemo.module.css";

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

/** 带数值回显的滑杆。 */
export function RangeField({ label, value, min, max, step = 1, suffix = "", onChange }: RangeFieldProps) {
  return (
    <label className={s.field}>
      <span className={s.fieldHead}>
        <span>{label}</span>
        <span className={s.fieldValue}>
          {Number.isInteger(value) ? value : value.toFixed(2)}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

interface OptionFieldProps<T extends string | number> {
  label: string;
  value: T;
  options: { key: string; label: string; value: T; swatch?: string }[];
  onChange: (value: T) => void;
}

/** 预设选择：色板与配色方案共用。 */
export function OptionField<T extends string | number>({ label, value, options, onChange }: OptionFieldProps<T>) {
  return (
    <div className={s.field}>
      <span className={s.fieldHead}>
        <span>{label}</span>
      </span>
      <div className={s.optionRow}>
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={option.value === value ? `${s.option} ${s.optionActive}` : s.option}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.swatch ? <span className={s.swatch} style={{ background: option.swatch }} /> : null}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 控制面板分组标题。 */
export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={s.group}>
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}
