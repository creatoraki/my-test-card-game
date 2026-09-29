import { ChevronGlyph, SettingsIcon, type SettingsIconName } from "./parts/settingsIcons";
import s from "./styles/settingsAction.module.css";

export interface SettingsActionProps {
  name: string;
  note: string;
  icon: SettingsIconName;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/** 系统操作按钮: 事件档案行动按钮同款的双线切角板, 悬浮时整颗亮成主题色; danger 为红色。 */
export function SettingsAction({ name, note, icon, danger = false, disabled = false, onClick }: SettingsActionProps) {
  return (
    <button
      className={s.button}
      type="button"
      data-tone={danger ? "danger" : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={s.plate} aria-hidden />
      <span className={s.icon}><SettingsIcon name={icon} /></span>
      <span className={s.text}>
        <strong>{name}</strong>
        <em>{note}</em>
      </span>
      <span className={s.arrow}><ChevronGlyph /></span>
    </button>
  );
}
