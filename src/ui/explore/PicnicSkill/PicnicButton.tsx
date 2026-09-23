import { canPicnic } from "@/explore/resources/picnic";
import { useExploreStore } from "@/store/explore/exploreStore";
import { RailPopover } from "@/ui/common/tooltip/RailPopover";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import { cx } from "@/ui/common/shared/cx";
import s from "./PicnicButton.module.css";

export default function PicnicButton({ onOpen }: { onOpen: () => void }) {
  // 只订阅布尔值, 行走中的会话提交不重渲染按钮。
  const active = useExploreStore((state) => Boolean(state.session));
  const used = useExploreStore((state) => Boolean(state.session?.picnicUsed));
  const allowed = useExploreStore((state) => Boolean(state.session && canPicnic(state.session)));
  if (!active) return null;

  const phaseLocked = !used && !allowed;
  const available = !used && !phaseLocked;

  return (
    <div
      className={s.shell}
      data-picnic-button
      data-rail-item={phaseLocked ? "" : undefined}
      tabIndex={phaseLocked ? 0 : undefined}
      aria-label={phaseLocked ? "野餐：当前阶段不可用" : undefined}
    >
      <button
        className={cx(s.button, available && s["is-available"], phaseLocked && s["is-locked"], used && s["is-used"])}
        type="button"
        disabled={!available}
        onClick={onOpen}
        aria-label={used ? "野餐：已使用" : "野餐"}
      >
        <span className={s.icon} aria-hidden="true">🧺</span>
        <span className={s.label}>野餐</span>
        <span className={s.badge}>{used ? "已使用" : "1 / 1"}</span>
      </button>
      {phaseLocked && (
        <RailPopover side="top-right">
          <TooltipCard title="野餐暂不可用" desc="完成物件交互、恢复自由行走后才能野餐。" />
        </RailPopover>
      )}
    </div>
  );
}
