import { useId } from "react";
import { cx } from "@/ui/common/shared/cx";
import s from "./CharacterNavigator.module.css";

interface Props {
  canPrevious: boolean;
  canNext: boolean;
  disabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function SwitchIcon({ direction, disabled, onSwitch }: {
  direction: "left" | "right";
  disabled: boolean;
  onSwitch: () => void;
}) {
  const gradientId = useId();
  const previous = direction === "left";
  const activate = () => { if (!disabled) onSwitch(); };
  return (
    <div className={cx(s.control, previous ? s.previous : s.next, disabled && s.disabled)}>
      <svg className={s.icon} viewBox="0 0 52 80" role="button"
        tabIndex={disabled ? -1 : 0} aria-disabled={disabled}
        aria-label={previous ? "上一个角色，快捷键 Q" : "下一个角色，快捷键 E"}
        aria-keyshortcuts={previous ? "Q" : "E"} onClick={activate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activate();
          }
        }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d4dce4" stopOpacity="0.38" />
            <stop offset="1" stopColor="#343c45" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <g transform={previous ? undefined : "translate(52 0) scale(-1 1)"}>
          <path className={s.surface} d="M42 5 8 36Q4 40 8 44L42 75 48 62 24 40 48 18Z" fill={"url(#" + gradientId + ")"} />
          <path className={s.arrow} d="M37 22 18 40 37 58" />
          <path className={s.edge} d="M42 9 10 38" />
        </g>
      </svg>
      <span className={s.shortcut} aria-hidden="true">{previous ? "Q" : "E"}</span>
    </div>
  );
}

export function CharacterNavigator({ canPrevious, canNext, disabled = false, onPrevious, onNext }: Props) {
  return (
    <nav className={s.navigator} aria-label="角色切换">
      <SwitchIcon direction="left" disabled={disabled || !canPrevious} onSwitch={onPrevious} />
      <SwitchIcon direction="right" disabled={disabled || !canNext} onSwitch={onNext} />
    </nav>
  );
}
