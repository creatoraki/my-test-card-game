import type { BattleChallenge } from "@/store/battleStore";
import { RailPopover } from "@/ui/battle/RailPopover";
import s from "./ChallengeRail.module.css";

export function ChallengeRail({ challenges }: { challenges: BattleChallenge[] }) {
  return (
    <aside className={s.rail} aria-label="挑战" onClick={(event) => event.stopPropagation()}>
      <div className={s.items}>
        {challenges.map((challenge) => (
          <div className={s.item} data-rail-item key={challenge.id} tabIndex={0}>
            <span className={s.icon}>{challenge.icon}</span>
            <span className={s.dot} />
            <RailPopover side="bottom-left">
              <strong>{challenge.title}</strong>
              <p>{challenge.desc}</p>
              {challenge.degraded && <em>效果已降级</em>}
              {challenge.dropBonus != null && <small>掉落加成 +{challenge.dropBonus.toFixed(2)}</small>}
            </RailPopover>
          </div>
        ))}
      </div>
    </aside>
  );
}
