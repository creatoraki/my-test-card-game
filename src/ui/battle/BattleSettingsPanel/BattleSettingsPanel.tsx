import type { BattleState } from "@/engine";
import { confirm } from "@/ui/common/ConfirmDialog";
import {
  AudioSettingsRows,
  SettingsAction,
  SettingsActions,
  SettingsPanelShell,
} from "@/ui/common/SettingsPanel";
import s from "./BattleSettingsPanel.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  battle: BattleState;
  battleSettled: boolean;
  onRetreat: () => void;
  onRestart: () => void;
}

// 战斗内设置面板: 音乐/音效的开关与音量, 以及撤退与重打两个危险操作。
// ★ 刻意不暂停战斗 —— 遮罩挡住输入即可(战斗是纯回合制, 没有实时倒计时)。
export function BattleSettingsPanel({
  open,
  onClose,
  battle,
  battleSettled,
  onRetreat,
  onRestart,
}: Props) {
  // 已分出胜负(胜利面板/战败遮罩已接管)之后, 这一场没有「撤退」与「重打」可言。
  const battleOver = battle.phase === "won" || battle.phase === "lost" || battleSettled;

  const askRestart = () => {
    confirm({
      title: "重新开始这场战斗？",
      text: "本场战斗从头再来，队员血量恢复到进入战斗前的状态。",
      detail: "已打出的牌、已造成的伤害与本场获得的组装部件全部作废。",
      confirmLabel: "重新开始",
      danger: true,
      onConfirm: () => {
        onClose();
        onRestart();
      },
    });
  };

  const askRetreat = () => {
    confirm({
      title: "撤退？",
      text: "本场战斗立即结束，整趟远征就此收尾并返回据点。",
      detail: "已获得的居民积分与背包物资照常带回，队员的当前伤势也会跨日保留。",
      confirmLabel: "撤退",
      danger: true,
      onConfirm: () => {
        onClose();
        onRetreat();
      },
    });
  };

  return (
    <SettingsPanelShell
      open={open}
      onClose={onClose}
      kicker="战斗设置"
      title="系统菜单"
      scrimClassName={s.scrim}
    >
      <AudioSettingsRows />
      <SettingsActions>
        <SettingsAction
          name="重新开始战斗"
          note="回到本场开局，血量与卡组重置"
          disabled={battleOver}
          onClick={askRestart}
        />
        <SettingsAction
          name="撤退"
          note="结束整趟远征，带着现有收获回据点"
          danger
          disabled={battleOver}
          onClick={askRetreat}
        />
      </SettingsActions>
    </SettingsPanelShell>
  );
}
