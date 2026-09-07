import s from "./UpgradeAction.module.css";

interface Props {
  canUpgrade: boolean;
  onUpgrade: () => void;
}

export function UpgradeAction({ canUpgrade, onUpgrade }: Props) {
  return (
    <button
      type="button"
      className={s.action}
      data-sfx="confirm"
      disabled={!canUpgrade}
      onClick={onUpgrade}
      aria-label="升阶选中的装备"
    >
      升阶
    </button>
  );
}