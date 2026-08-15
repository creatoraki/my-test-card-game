// ★ 训练室通用确认弹窗 —— 重置分配与切换徽章共用, 抽自旧 TrainingScene 的 .tr-confirm。
// 只做展示与两个按钮, 语义完全由调用方的文案决定。

import type { ReactNode } from "react";
import s from "./TrainingConfirm.module.css";

interface TrainingConfirmProps {
  kicker: string;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TrainingConfirm({
  kicker,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: TrainingConfirmProps) {
  return (
    <div className={s["tc"]} role="dialog" aria-modal="true" aria-label={title}>
      <div className={s["tc-panel"]}>
        <span className={s["tc-kicker"]}>{kicker}</span>
        <h3 className={s["tc-title"]}>{title}</h3>
        <p className={s["tc-message"]}>{message}</p>
        <div className={s["tc-actions"]}>
          <button type="button" onClick={onCancel}>
            取消
          </button>
          <button className={s["tc-primary"]} type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
