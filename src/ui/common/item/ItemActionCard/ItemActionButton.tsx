// 物品操作按钮 —— 切角科幻按钮 + 左侧小图标。操作卡、开箱演出、仓库操作区共用。
// 四种色调: primary 青(使用 / 拾取)、module 紫(装载 / 拆箱)、danger 红(确认丢弃)、default 灰。

import type { CSSProperties, MouseEvent } from "react";
import { cx } from "@/ui/common/shared/cx";
import { ActionIcon, type ActionIconName } from "./actionIcons";
import s from "./ItemActionButton.module.css";

export type ItemActionTone = "primary" | "module" | "danger" | "default";

interface Props {
  label: string;
  tone?: ItemActionTone;
  icon?: ActionIconName;
  disabled?: boolean;
  /** 二次确认的待确认态: 红色脉冲。 */
  armed?: boolean;
  /** 撑满父容器宽度(横排平分时用)。 */
  block?: boolean;
  /** 进场错开序号(× 30ms)。 */
  order?: number;
  className?: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function ItemActionButton({
  label,
  tone = "default",
  icon,
  disabled,
  armed,
  block,
  order = 0,
  className,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      className={cx(s.btn, block && s.block, armed && s.armed, className)}
      data-tone={armed ? "danger" : tone}
      disabled={disabled}
      style={{ "--ab-order": order } as CSSProperties}
      onClick={onClick}
    >
      <span className={s.face}>
        {icon && <ActionIcon name={armed ? "confirm" : icon} className={s.icon} />}
        <span className={s.label}>{label}</span>
      </span>
    </button>
  );
}
