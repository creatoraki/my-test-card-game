import { confirm } from "@/ui/common/ConfirmDialog";
import {
  AudioSettingsRows,
  SettingsAction,
  SettingsActions,
  SettingsPanelShell,
} from "@/ui/common/SettingsPanel";
import s from "./StationSettingsPanel.module.css";

export interface StationSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onResetProfile: () => void;
  onTestReward?: () => void;
}

export function StationSettingsPanel({
  open,
  onClose,
  onResetProfile,
  onTestReward,
}: StationSettingsPanelProps) {
  const askReset = () => {
    confirm({
      title: "重置存档",
      text: "据点档案、队员、库存与训练进度将全部清空，回到第 1 日。",
      detail: "该操作不可撤销。",
      confirmLabel: "确认重置",
      cancelLabel: "再想想",
      danger: true,
      onConfirm: onResetProfile,
    });
  };

  return (
    <SettingsPanelShell
      open={open}
      onClose={onClose}
      kicker="据点终端"
      title="系统菜单"
      scrimClassName={s.scrim}
    >
      <AudioSettingsRows />
      <SettingsActions>
        <SettingsAction
          name="重置存档"
          note="清空据点档案，回到第 1 日"
          danger
          onClick={askReset}
        />
        {onTestReward && (
          <SettingsAction
            name="测试奖励"
            note="发放 2000 经验与 10000 积分"
            onClick={onTestReward}
          />
        )}
      </SettingsActions>
    </SettingsPanelShell>
  );
}
