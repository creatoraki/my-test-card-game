import { useEffect, type ReactNode } from "react";
import { useConfirmStore } from "@/ui/common/ConfirmDialog";
import { cx } from "@/ui/common/cx";
import s from "./SettingsPanel.module.css";

export interface SettingsPanelShellProps {
  open: boolean;
  onClose: () => void;
  kicker: string;
  title: string;
  scrimClassName?: string;
  children: ReactNode;
}

export function SettingsPanelShell({
  open,
  onClose,
  kicker,
  title,
  scrimClassName,
  children,
}: SettingsPanelShellProps) {
  // Esc 关面板。⚠ 用捕获阶段并吃掉事件 —— 战斗页另有 Esc 监听, 面板开着时不该让它抢走这一下。
  // ⚠ 确认框开着时必须让路: 它自己也在 window 捕获阶段听 Esc, 否则会留下确认框而关掉本面板。
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

  return (
    <div className={cx(s.scrim, scrimClassName)} role="presentation" onClick={onClose}>
      <section
        className={s.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={s.head}>
          <div>
            <span className={s.kicker}>{kicker}</span>
            <h2 id="settings-panel-title">{title}</h2>
          </div>
          <button className={s.close} type="button" aria-label="关闭设置" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
