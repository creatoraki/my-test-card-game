// 工房操作按钮：切角渐变描边 + 悬停扫光；传入 confirmLabel 时启用原地二次确认。

import { cx } from "@/ui/common/cx";
import { CONFIRM_WINDOW_MS, useArmedConfirm } from "./useArmedConfirm";
import s from "./EquipAction.module.css";

interface Props {
  disabled?: boolean;
  label: string;
  ariaLabel: string;
  /** 待确认态显示的文案；不传则单击直接执行。 */
  confirmLabel?: string;
  onClick: () => void;
}

export function EquipAction({ disabled = false, label, ariaLabel, confirmLabel, onClick }: Props) {
  const { armed, armId, trigger, disarm } = useArmedConfirm(onClick, Boolean(confirmLabel), disabled, label);

  return (
    <button
      type="button"
      className={cx(s.action, armed && s.armed)}
      aria-label={armed ? confirmLabel : ariaLabel}
      disabled={disabled}
      onClick={trigger}
      onKeyDown={(event) => event.key === "Escape" && disarm()}
    >
      <span className={s.label}>{armed ? confirmLabel : label}</span>
      {armed && (
        <span
          key={armId}
          className={s.countdown}
          style={{ animationDuration: `${CONFIRM_WINDOW_MS}ms` }}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
