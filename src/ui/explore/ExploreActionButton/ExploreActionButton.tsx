import type { ReactNode } from "react";
import type { Chamfer } from "@/ui/common/frame/NeonPlate/plateGeometry";
import { ActionFrame } from "./ActionFrame";
import { useHoldCharge } from "./useHoldCharge";
import s from "./ExploreActionButton.module.css";

/** 语义色：cyan=信标类冷色功能、amber=补给类暖色功能、alert=撤离等高风险操作。 */
export type ActionTone = "cyan" | "amber" | "alert";
/** ready=可用、locked=当前阶段不可用、used=本次远征已用完。 */
export type ActionState = "ready" | "locked" | "used";

const CHAMFER: Chamfer = { tl: 10, tr: 4, br: 14, bl: 4 };

interface Props {
  tone: ActionTone;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  state?: ActionState;
  onClick?: () => void;
  /** 传入即改为长按充能确认：按住满 holdMs 毫秒才触发 onClick。 */
  holdMs?: number;
  /** 充能期间替换主文案。 */
  holdLabel?: string;
  ariaLabel?: string;
  width?: number;
  height?: number;
}

/** 探索底栏行动按钮：切角霓虹牌面 + 图标 / 文案 / 角标，可选长按充能确认。 */
export function ExploreActionButton({
  tone,
  label,
  icon,
  badge,
  state = "ready",
  onClick,
  holdMs,
  holdLabel = "按住充能…",
  ariaLabel,
  width = 216,
  height = 58,
}: Props) {
  const ready = state === "ready";
  const hold = useHoldCharge<HTMLButtonElement>({ duration: holdMs ?? 0, enabled: ready, onComplete: () => onClick?.() });
  const holdable = Boolean(holdMs);
  return (
    <button
      ref={hold.ref}
      className={s.button}
      type="button"
      data-tone={tone}
      data-state={state}
      data-hold={holdable || undefined}
      data-charging={hold.charging || undefined}
      style={{ width, height }}
      disabled={!ready}
      aria-label={ariaLabel ?? (holdable ? `${label}（长按确认）` : label)}
      onClick={holdable ? undefined : onClick}
      {...hold.handlers}
    >
      <ActionFrame width={width} height={height} chamfer={CHAMFER} charge={holdable} />
      {icon && <span className={s.icon} aria-hidden="true">{icon}</span>}
      <span className={s.label}>{hold.charging ? holdLabel : label}</span>
      {badge != null && !hold.charging && <span className={s.badge}>{badge}</span>}
    </button>
  );
}
