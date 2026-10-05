// 编队卡底部的上阵 / 下阵胶囊按钮(疗养中则换成不可点的状态条)。
// ★ 外层槽位负责定位并接收悬浮事件: disabled 的 button 自己不派发指针事件,
//   不可操作的原因提示只能挂在槽位上。
// ★ 上阵态按钮点亮成角色色实心胶囊, 两侧箭头向外呼吸, 表达"已在阵中, 点击下阵"。

import { HoverTooltip, useHoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import { cx } from "@/ui/common/shared/cx";
import s from "./CrewToggle.module.css";

interface Props {
  upgrade?: boolean;
  upgradeDisabled?: boolean;
  upgradeReady?: boolean;
  onField: boolean;
  resting: boolean;
  blocked: boolean;
  tooltipTitle: string;
  tooltipReason: string;
  onToggle: () => void;
}

export function CrewToggle({ upgrade = false, upgradeDisabled = false, upgradeReady = false, onField, resting, blocked, tooltipTitle, tooltipReason, onToggle }: Props) {
  const { point, bind } = useHoverTooltip();

  return (
    <span className={s.slot} {...bind}>
      {resting && !upgrade ? (
        <span className={s.banner}>疗养中</span>
      ) : (
        <button
          className={cx(s.toggle, onField && s["is-on"])}
          type="button"
          disabled={upgrade ? upgradeDisabled : blocked}
          aria-label={upgrade && upgradeReady ? "升级，经验已足够升级" : undefined}
          onClick={onToggle}
        >
          {onField && <Chevrons side="left" />}
          <span className={s.label}>{upgrade ? "升级" : onField ? "下阵" : "上阵"}</span>
          {onField && <Chevrons side="right" />}
        </button>
      )}
      {upgrade && upgradeReady && !upgradeDisabled && <span className={s.notice} aria-hidden="true" />}
      {!upgrade && (resting || blocked) && point && (
        <HoverTooltip point={point}>
          <TooltipCard title={tooltipTitle} desc={tooltipReason} />
        </HoverTooltip>
      )}
    </span>
  );
}

function Chevrons({ side }: { side: "left" | "right" }) {
  return (
    <svg className={cx(s.chev, s[`chev-${side}`])} viewBox="0 0 20 16" fill="none" aria-hidden="true">
      <path d="M8 2 L2 8 L8 14 M16 2 L10 8 L16 14" />
    </svg>
  );
}
