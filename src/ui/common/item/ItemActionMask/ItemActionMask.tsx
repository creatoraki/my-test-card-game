// 物品格的「交互模式」遮罩 —— 点击物品后盖在格子上的黑色遮罩 + 竖排操作按钮。
//
// 底部背包、大背包之外的所有物品网格(胜利回收背包 / 战利品盘 / 拾取浮层 / 事件掉落)共用。
// 显隐由 useSlotActionMode 管: 点格子进入、鼠标移出格子包裹层退出。
// 带 confirmLabel 的按钮走原地二次确认: 第一次点只换成确认态, 第二次才执行;
// 遮罩一卸载确认态就跟着没了, 不会挂到下一件东西上。

import { useState, type MouseEvent } from "react";
import { cx } from "@/ui/common/shared/cx";
import s from "./ItemActionMask.module.css";

export interface SlotAction {
  key: string;
  label: string;
  tone?: "primary" | "danger" | "module" | "default";
  disabled?: boolean;
  /** 传了就需要二次确认, 确认态按钮显示这段文字。 */
  confirmLabel?: string;
  onSelect: () => void;
}

interface Props {
  actions: readonly SlotAction[];
  /** 点遮罩空白处: 退出交互模式。 */
  onDismiss?: () => void;
}

export function ItemActionMask({ actions, onDismiss }: Props) {
  const [confirming, setConfirming] = useState<string | null>(null);

  const fire = (event: MouseEvent<HTMLButtonElement>, action: SlotAction) => {
    // 遮罩压在 ItemSlot 上方, 点击不能冒泡回格子或外层面板。
    event.stopPropagation();
    event.preventDefault();
    if (action.confirmLabel && confirming !== action.key) {
      setConfirming(action.key);
      return;
    }
    setConfirming(null);
    action.onSelect();
  };

  return (
    <div
      className={s.mask}
      onClick={(event) => {
        event.stopPropagation();
        onDismiss?.();
      }}
    >
      {actions.map((action) => {
        const armed = confirming === action.key;
        return (
          <button
            key={action.key}
            type="button"
            className={cx(s.btn, s[`tone-${armed ? "danger" : action.tone ?? "default"}`], armed && s.armed)}
            disabled={action.disabled}
            onClick={(event) => fire(event, action)}
          >
            {armed ? action.confirmLabel : action.label}
          </button>
        );
      })}
    </div>
  );
}
