import { useEffect, useState, type ReactNode } from "react";
import { useConfirmStore } from "@/ui/common/control/ConfirmDialog";
import { PANEL_OUT_MS, PanelShell } from "@/ui/common/frame/PanelShell";

// 设置面板外壳直接走 common/PanelShell(遮罩 + 切角半透面板 + EventPanelFrame)。
const SETTINGS_ACCENT = "#52cfff";
const SETTINGS_SIZE = { w: 900 };

export interface SettingsPanelShellProps {
  open: boolean;
  onClose: () => void;
  kicker: string;
  title: string;
  /** 遮罩层附加类名 —— 各场景据此压自己的 z-index / 遮罩浓度。 */
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
  // open 置假后多留 PANEL_OUT_MS 播完退场动画再卸载。
  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);

  useEffect(() => {
    if (open || !shown) return;
    const timer = window.setTimeout(() => setShown(false), PANEL_OUT_MS);
    return () => window.clearTimeout(timer);
  }, [open, shown]);

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

  if (!shown) return null;

  return (
    <PanelShell
      accent={SETTINGS_ACCENT}
      title={title}
      status={kicker}
      closeLabel="关闭设置"
      closing={!open}
      onClose={onClose}
      size={SETTINGS_SIZE}
      className={scrimClassName}
    >
      {children}
    </PanelShell>
  );
}
