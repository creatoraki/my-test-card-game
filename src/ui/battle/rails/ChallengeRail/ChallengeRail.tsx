import { useEffect, useRef, useState } from "react";
import { CHALLENGE_DEFS, type ChallengeRun } from "@/engine";
import { arcadeGoalLabel } from "@/explore/curio/arcade";
import { useExploreStore } from "@/store/explore/exploreStore";
import { ChallengeIcon } from "@/ui/art/challenge";
import { RailPopover } from "@/ui/common/tooltip/RailPopover";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import s from "./ChallengeRail.module.css";

/** 游艺摊押注提示：挂在每个挑战的悬浮说明里，提醒本场有钱币押在挑战数上。 */
function useBetNote(): string | null {
  const bet = useExploreStore((state) => state.session?.arcadeBet ?? null);
  return bet ? `游艺摊押注 ${bet.stakes.length} 枚钱币：本场${arcadeGoalLabel(bet.goal)}` : null;
}

function ChallengeItem({ run, betNote }: { run: ChallengeRun; betNote: string | null }) {
  const def = CHALLENGE_DEFS[run.id];
  const previousBroken = useRef(run.broken);
  const [breaking, setBreaking] = useState(false);

  useEffect(() => {
    if (!previousBroken.current && run.broken) {
      setBreaking(true);
      const timer = window.setTimeout(() => setBreaking(false), 1000);
      previousBroken.current = run.broken;
      return () => window.clearTimeout(timer);
    }
    previousBroken.current = run.broken;
  }, [run.broken]);

  const state = run.broken ? (breaking ? "breaking" : "broken") : "ok";
  return (
    <div className={s.item} data-rail-item data-state={state} tabIndex={0}>
      <ChallengeIcon className={s.icon} id={run.id} size={64} broken={run.broken} />
      <span className={s.stroke} />
      <span className={`${s.stroke} ${s.strokeSecond}`} />
      <span className={s.dot} />
      <RailPopover side="bottom-left">
        <TooltipCard
          icon={<ChallengeIcon id={run.id} size={96} broken={run.broken} />}
          title={def.title}
          desc={def.desc}
          notes={[
            { text: `掉落加成 +${def.dropBonus.toFixed(2)}` },
            ...(run.broken ? [{ text: "已打破 —— 本场不再获得该奖励", tone: "bad" as const }] : []),
            ...(betNote ? [{ text: betNote, tone: "accent" as const }] : []),
          ]}
        />
      </RailPopover>
    </div>
  );
}

export function ChallengeRail({ challenges }: { challenges: ChallengeRun[] }) {
  const betNote = useBetNote();
  return (
    <aside className={s.rail} aria-label="挑战" onClick={(event) => event.stopPropagation()}>
      <div className={s.items}>
        {challenges.map((run) => <ChallengeItem key={run.id} run={run} betNote={betNote} />)}
      </div>
    </aside>
  );
}
