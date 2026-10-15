import { useDevTestStore } from "@/store/dev/devTestStore";
import { confirm } from "@/ui/common/control/ConfirmDialog";
import {
  AudioSettingsRows,
  SettingsAction,
  SettingsActions,
  SettingsPanelShell,
  SettingsSection,
  SettingsToggleRow,
} from "@/ui/common/control/SettingsPanel";
import s from "./StationSettingsPanel.module.css";

export interface StationSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onResetProfile: () => void;
  /** 测试奖励: 只在测试模式开启时露出按钮。 */
  onTestReward: () => void;
}

export function StationSettingsPanel({
  open,
  onClose,
  onResetProfile,
  onTestReward,
}: StationSettingsPanelProps) {
  const testMode = useDevTestStore((state) => state.testMode);
  const toggleTest = useDevTestStore((state) => state.toggle);
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
      compact
      scrimClassName={s.scrim}
    >
      <AudioSettingsRows />
      <SettingsSection title="调试">
        <SettingsToggleRow
          name="测试模式"
          note="开放全部地图与建筑，跳过电梯过场"
          on={testMode}
          onToggle={() => toggleTest("testMode")}
        />
      </SettingsSection>
      <SettingsActions>
        <SettingsAction
          name="重置存档"
          note="清空据点档案，回到第 1 日"
          icon="reset"
          danger
          onClick={askReset}
        />
        {testMode && (
          <SettingsAction
            name="测试奖励"
            note="2000 经验 · 10000 积分"
            icon="reward"
            onClick={onTestReward}
          />
        )}
      </SettingsActions>
    </SettingsPanelShell>
  );
}
