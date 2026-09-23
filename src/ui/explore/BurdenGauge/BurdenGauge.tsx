import { burdenDodgePenalty, burdenHitPenalty, burdenPrecisionPenalty, RULES } from "@/engine";
import { backpackSlots, burdenNow, partyBurdenAdapt } from "@/explore/session";
import { useExploreStore } from "@/store/explore/exploreStore";
import { RailPopover } from "@/ui/common/tooltip/RailPopover";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
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
  // 只订阅数值: 行走中的暗雷检定 / 扣粒子等提交不会让负重读数重渲染。
  const active = useExploreStore((state) => Boolean(state.session));
  const occupied = useExploreStore((state) => state.session ? backpackSlots(state.session) : 0);
  const adapt = useExploreStore((state) => state.session ? partyBurdenAdapt(state.session) : 0);
  const burden = useExploreStore((state) => state.session ? burdenNow(state.session) : 0);
  const occupiedShown = useCountUp(occupied, 0, 260);

  if (!active) return null;

  const total = RULES.burden.backpackSlots;
  const hitPenalty = burdenHitPenalty(burden);
  const dodgePenalty = burdenDodgePenalty(burden);
  const precisionPenalty = burdenPrecisionPenalty(burden);
  const fill = total > 0 ? occupied / total : 0;
  const level = fill >= 1 ? "full" : fill >= WARN_AT ? "warn" : "ok";
  const adaptNote = adapt > 0 ? `（占格 ${occupied} − 小队负重适应 ${adapt}）` : "";

  return (
    <div
      className={s.gauge}
      data-level={level}
      data-rail-item
      tabIndex={0}
      aria-label={`背包负重，已占 ${occupied} / ${total} 格，有效负重 ${burden}，命中 −${hitPenalty}%，闪避 −${dodgePenalty}%，精准 −${precisionPenalty}%`}
    >
      <BackpackIcon />
      <span key={occupied} className={s.slots}>
        {occupiedShown}/{total}
      </span>
      <RailPopover side="bottom-right">
        <TooltipCard title="背包负重">
          <div className={s.detail}>
            <p>已占 {occupied} / {total} 格</p>
            <p>有效负重 {burden}{adaptNote}</p>
            <p>命中 −{hitPenalty}%</p>
            <p>闪避 −{dodgePenalty}%</p>
            <p>精准 −{precisionPenalty}%</p>
          </div>
        </TooltipCard>
      </RailPopover>
    </div>
  );
}
