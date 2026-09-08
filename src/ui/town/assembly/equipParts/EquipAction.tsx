import s from "./EquipAction.module.css";

interface Props {
  disabled?: boolean;
  label: string;
  ariaLabel: string;
  onClick: () => void;
}

export function EquipAction({ disabled = false, label, ariaLabel, onClick }: Props) {
  return (
    <button
      type="button"
      className={s.action}
      data-sfx="confirm"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {label}
    </button>
  );
}
