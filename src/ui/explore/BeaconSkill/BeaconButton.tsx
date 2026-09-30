import { canUseBeacon, hasExploreRelic } from "@/explore/relics/relicModifiers";
import { useExploreStore } from "@/store/explore/exploreStore";
import { RailPopover } from "@/ui/common/tooltip/RailPopover";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import { ExploreActionButton } from "@/ui/explore/ExploreActionButton";
import s from "./BeaconButton.module.css";

export default function BeaconButton({ onPick }: { onPick: () => void }) {
  // 只订阅布尔值, 行走中的会话提交不重渲染按钮。
  const owned = useExploreStore((state) => Boolean(state.session && hasExploreRelic(state.session, "relic-emergency-beacon")));
  const used = useExploreStore((state) => Boolean(state.session?.beaconUsed));
  const usable = useExploreStore((state) => Boolean(state.session && canUseBeacon(state.session)));
  if (!owned) return null;

  const phaseLocked = !used && !usable;

  return (
    <div
      className={s.shell}
      data-beacon-button
      data-rail-item={phaseLocked ? "" : undefined}
      tabIndex={phaseLocked ? 0 : undefined}
      aria-label={phaseLocked ? "应急信标：当前阶段不可用" : undefined}
    >
      <ExploreActionButton
        tone="cyan"
        state={used ? "used" : phaseLocked ? "locked" : "ready"}
        icon="📡"
        label="应急信标"
        badge={used ? "已使用" : "1/1"}
        ariaLabel={used ? "应急信标：已使用" : "应急信标"}
        onClick={onPick}
      />
      {phaseLocked && (
        <RailPopover side="top-right">
          <TooltipCard title="应急信标暂不可用" desc="完成物件交互、恢复自由行走后才能选择传送房间。" />
        </RailPopover>
      )}
    </div>
  );
}
