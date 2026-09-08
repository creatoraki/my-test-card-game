import { burdenHitPenalty, burdenInitiativePenalty, RULES } from "@/engine";
import { backpackSlots, burdenNow, partyBurdenAdapt } from "@/explore/session";
import { useExploreStore } from "@/store/exploreStore";
import { RailPopover } from "@/ui/common/RailPopover";
import { useCountUp } from "@/ui/hooks/useCountUp";
import s from "./BurdenGauge.module.css";

const WARN_AT = 0.8;

function BackpackIcon() {
  return (
    <svg
      className={s.icon}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13 18h22l3 20H10l3-20ZM17 18c0-5 3-8 7-8s7 3 7 8" strokeWidth="1.8" />
      <path d="M24 23v10M19 28h10" strokeWidth="1.8" />
    </svg>
  );
}

export function BurdenGauge() {
  const session = useExploreStore((state) => state.session);
  const occupied = session ? backpackSlots(session) : 0;
  const occupiedShown = useCountUp(occupied, 0, 260);

  if (!session) return null;

  const total = RULES.burden.backpackSlots;
  const adapt = partyBurdenAdapt(session);
  const burden = burdenNow(session);
  const hitPenalty = burdenHitPenalty(burden);
  const initiativePenalty = burdenInitiativePenalty(burden);
  const fill = total > 0 ? occupied / total : 0;
  const level = fill >= 1 ? "full" : fill >= WARN_AT ? "warn" : "ok";
  const adaptNote = adapt > 0 ? `（占格 ${occupied} − 小队负重适应 ${adapt}）` : "";

  return (
    <div
      className={s.gauge}
      data-level={level}
      data-rail-item
      tabIndex={0}
      aria-label={`背包负重，已占 ${occupied} / ${total} 格，有效负重 ${burden}，命中 −${hitPenalty}%，先手 −${initiativePenalty}`}
    >
      <BackpackIcon />
      <span key={occupied} className={s.slots}>
        {occupiedShown}/{total}
      </span>
      <RailPopover side="bottom-right" className={s.popover}>
        <strong className={s.title}>背包负重</strong>
        <div className={s.detail}>
          <p>已占 {occupied} / {total} 格</p>
          <p>有效负重 {burden}{adaptNote}</p>
          <p>命中 −{hitPenalty}%</p>
          <p>先手 −{initiativePenalty}</p>
        </div>
      </RailPopover>
    </div>
  );
}
