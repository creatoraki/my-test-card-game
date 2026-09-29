import { PlateButton, type PlateIconName } from "@/ui/common/control/PlateButton";

export interface SettingsActionProps {
  name: string;
  note: string;
  icon: PlateIconName;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/** 系统操作按钮: 事件档案同款的双线切角板, 悬浮时整颗亮成主题色; danger 为红色。 */
export function SettingsAction({ name, note, icon, danger = false, disabled = false, onClick }: SettingsActionProps) {
  return (
    <PlateButton
      label={name}
      note={note}
      icon={icon}
      danger={danger}
      disabled={disabled}
      onClick={onClick}
    />
  );
}
