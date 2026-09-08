import { useEffect } from "react";
import type { BattleState } from "@/engine";
import { playSfx } from "@/ui/audio";
import { confirm, useConfirmStore } from "@/ui/common/ConfirmDialog";
import { VolumeSlider } from "@/ui/common/VolumeSlider";
import { setBgmVolume, toggleBgm, useBgmEnabled, useBgmVolume } from "@/ui/hooks/useBgm";
import { setSfxVolume, toggleSfx, useSfxEnabled, useSfxVolume } from "@/ui/hooks/useSfx";
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
  const bgmEnabled = useBgmEnabled();
  const bgmVolume = useBgmVolume();
  const sfxEnabled = useSfxEnabled();
  const sfxVolume = useSfxVolume();

  // Esc 关面板。⚠ 用捕获阶段并吃掉事件 —— BattleScreen 在 window 上另有一个 Esc/空格
  //   「跳过演出」的监听, 面板开着时不该让它抢走这一下。
  // ⚠ 确认框开着时必须让路: 它自己也在 window 捕获阶段听 Esc, 而本监听注册得更早,
  //   不让开的话「Esc 取消确认」会变成「关掉设置面板、确认框留在原地」。
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (useConfirmStore.getState().request) return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;

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
    <div className={s.scrim} role="presentation" onClick={onClose}>
      <section
        className={s.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="battle-settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={s.head}>
          <div>
            <span className={s.kicker}>战斗设置</span>
            <h2 id="battle-settings-title">系统菜单</h2>
          </div>
          <button className={s.close} type="button" aria-label="关闭设置" onClick={onClose}>
            ×
          </button>
        </div>

        <div className={s.section}>
          <div className={s.row}>
            <span className={s.rowName}>音乐</span>
            <button
              className={s.toggle}
              type="button"
              aria-pressed={bgmEnabled}
              onClick={toggleBgm}
            >
              {bgmEnabled ? "已开启" : "已关闭"}
            </button>
            <VolumeSlider
              label="音乐音量"
              value={bgmVolume}
              disabled={!bgmEnabled}
              onChange={setBgmVolume}
            />
          </div>
          <div className={s.row}>
            <span className={s.rowName}>音效</span>
            <button
              className={s.toggle}
              type="button"
              aria-pressed={sfxEnabled}
              onClick={toggleSfx}
            >
              {sfxEnabled ? "已开启" : "已关闭"}
            </button>
            <VolumeSlider
              label="音效音量"
              value={sfxVolume}
              disabled={!sfxEnabled}
              onChange={setSfxVolume}
              // 松手才试听: 拖动过程中每一格都响会被 playSfx 的节流吃掉大半, 且很吵。
              onCommit={() => playSfx("click")}
            />
          </div>
        </div>

        <div className={s.actions}>
          <button className={s.action} type="button" disabled={battleOver} onClick={askRestart}>
            <span className={s.actionName}>重新开始战斗</span>
            <span className={s.actionNote}>回到本场开局，血量与卡组重置</span>
          </button>
          <button
            className={`${s.action} ${s.danger}`}
            type="button"
            disabled={battleOver}
            onClick={askRetreat}
          >
            <span className={s.actionName}>撤退</span>
            <span className={s.actionNote}>结束整趟远征，带着现有收获回据点</span>
          </button>
        </div>
      </section>
    </div>
  );
}
