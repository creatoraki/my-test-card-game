import { canUseBeacon, hasExploreRelic } from "@/explore/relicModifiers";
import { useExploreStore } from "@/store/exploreStore";
import { RailPopover } from "@/ui/common/RailPopover";
import { TooltipCard } from "@/ui/common/TooltipCard";
import { cx } from "@/ui/common/cx";
import s from "./BeaconButton.module.css";

export default function BeaconButton({ onPick }: { onPick: () => void }) {
  const session = useExploreStore((state) => state.session);
  if (!session || !hasExploreRelic(session, "relic-emergency-beacon")) return null;

  const used = session.beaconUsed;
  const phaseLocked = !used && !canUseBeacon(session);
  const available = !used && !phaseLocked;

  return (
    <div
      className={s.shell}
      data-beacon-button
      data-rail-item={phaseLocked ? "" : undefined}
      tabIndex={phaseLocked ? 0 : undefined}
      aria-label={phaseLocked ? "应急信标：当前阶段不可用" : undefined}
    >
      <button
        className={cx(s.button, available && s["is-available"], phaseLocked && s["is-locked"], used && s["is-used"])}
        type="button"
        disabled={!available}
        onClick={onPick}
        aria-label={used ? "应急信标：已使用" : "应急信标"}
      >
        <span className={s.icon} aria-hidden="true">📡</span>
        <span className={s.label}>应急信标</span>
        <span className={s.badge}>{used ? "已使用" : "1 / 1"}</span>
      </button>
      {phaseLocked && (
        <RailPopover side="top-right">
          <TooltipCard title="应急信标暂不可用" desc="完成物件交互、恢复自由行走后才能选择传送房间。" />
        </RailPopover>
      )}
    </div>
  );
}
