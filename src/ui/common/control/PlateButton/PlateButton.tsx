import { forwardRef, type ReactNode } from "react";
import { ChevronGlyph, PlateIcon, type PlateIconName } from "./plateIcons";
import s from "./PlateButton.module.css";

export interface PlateButtonProps {
  label: ReactNode;
  /** 标签下方的一行小字说明。 */
  note?: ReactNode;
  icon: PlateIconName;
  /** 常亮: 不悬浮也显示主题色实心亮板, 用于推荐 / 确认类操作。 */
  lit?: boolean;
  /** 警示红配色。 */
  danger?: boolean;
  disabled?: boolean;
  className?: string;
  onClick: () => void;
}

/** 事件档案同款的双线切角板按钮: 左图标 + 标签(+说明) + 右箭头。尺寸由调用方容器决定。 */
export const PlateButton = forwardRef<HTMLButtonElement, PlateButtonProps>(function PlateButton(
  { label, note, icon, lit = false, danger = false, disabled = false, className, onClick },
  ref,
) {
  return (
    <button
      ref={ref}
      className={className ? `${s.button} ${className}` : s.button}
      type="button"
      data-tone={danger ? "danger" : undefined}
      data-lit={lit || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={s.plate} aria-hidden />
      <span className={s.icon}><PlateIcon name={icon} /></span>
      <span className={s.text}>
        <strong>{label}</strong>
        {note && <em>{note}</em>}
      </span>
      <span className={s.arrow}><ChevronGlyph /></span>
    </button>
  );
});
