// 三选一底栏: 左侧提示行(未选 / 已选卡名) + 右侧「放弃」与「确认」按钮。落位全部取自 pickGeometry。
import type { ReactNode } from "react";
import { PickButton } from "./PickButton";
import { DoubleChevron, InfoIcon } from "./pickIcons";
import { CONFIRM_BUTTON, FOOTER_HINT, SKIP_BUTTON } from "./pickGeometry";
import s from "./PickFooter.module.css";

interface Props {
  note: ReactNode;
  allowSkip: boolean;
  skipLabel: string;
  confirmLabel: string;
  canConfirm: boolean;
  onSkip: () => void;
  onConfirm: () => void;
}

export function PickFooter({ note, allowSkip, skipLabel, confirmLabel, canConfirm, onSkip, onConfirm }: Props) {
  return (
    <div className={s.foot} data-sfx="off">
      <p
        className={s.hint}
        style={{ left: FOOTER_HINT.x, top: FOOTER_HINT.y, width: FOOTER_HINT.w, height: FOOTER_HINT.h }}
      >
        <InfoIcon className={s.icon} />
        <span className={s.note}>{note}</span>
      </p>
      {allowSkip && (
        <PickButton rect={SKIP_BUTTON} kind="skip" onClick={onSkip}>
          {skipLabel}
        </PickButton>
      )}
      <PickButton rect={CONFIRM_BUTTON} kind="confirm" disabled={!canConfirm} icon={<DoubleChevron />} onClick={onConfirm}>
        {confirmLabel}
      </PickButton>
    </div>
  );
}
