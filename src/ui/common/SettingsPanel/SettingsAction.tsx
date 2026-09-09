import { cx } from "@/ui/common/cx";
import s from "./SettingsPanel.module.css";

export interface SettingsActionProps {
  name: string;
  note: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function SettingsAction({ name, note, danger = false, disabled = false, onClick }: SettingsActionProps) {
  return (
    <button
      className={cx(s.action, danger && s.danger)}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      <span className={s.actionName}>{name}</span>
      <span className={s.actionNote}>{note}</span>
    </button>
  );
}
