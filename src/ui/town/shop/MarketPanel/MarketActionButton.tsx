// 商店底部的操作按钮。几何与光效由 MarketActionButton.module.css 统一提供,
// 调用方只决定色调(金 = 交易类, 青 = 设施类)与文案。

import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./MarketActionButton.module.css";

interface Props {
  /** 金 = 刷新货架一类的交易动作; 青 = 设施升级一类的建造动作。 */
  tone: "gold" | "cyan";
  icon: ReactNode;
  label: string;
  /** 竖线右侧的附加信息, 如「800 积分」「等级 3」。 */
  meta: string;
  disabled?: boolean;
  onClick: () => void;
}

export function MarketActionButton({ tone, icon, label, meta, disabled = false, onClick }: Props) {
  return (
    <button className={cx(s.button, s[tone])} type="button" disabled={disabled} onClick={onClick}>
      <span className={s.icon} aria-hidden="true">{icon}</span>
      <span className={s.label}>{label}</span>
      <span className={s.meta}>{meta}</span>
    </button>
  );
}

export default MarketActionButton;
