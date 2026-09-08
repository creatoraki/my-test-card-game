import { canPicnic } from "@/explore/picnic";
import { useExploreStore } from "@/store/exploreStore";
import { RailPopover } from "@/ui/common/RailPopover";
import { cx } from "@/ui/common/cx";
import s from "./PicnicButton.module.css";

export default function PicnicButton({ onOpen }: { onOpen: () => void }) {
  const session = useExploreStore((state) => state.session);
  if (!session) return null;

  const used = session.picnicUsed;
  const phaseLocked = !used && !canPicnic(session);
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
          <strong>野餐暂不可用</strong>
          <p>结算落点后或选择入口时才能野餐。</p>
        </RailPopover>
      )}
    </div>
  );
}
