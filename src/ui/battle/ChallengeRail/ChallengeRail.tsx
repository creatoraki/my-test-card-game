import { useEffect, useRef, useState } from "react";
import { CHALLENGE_DEFS, type ChallengeRun } from "@/engine";
import { RailPopover } from "@/ui/battle/RailPopover";
import s from "./ChallengeRail.module.css";

function ChallengeItem({ run }: { run: ChallengeRun }) {
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
      <span className={s.icon}>{def.icon}</span>
      <span className={s.stroke} />
      <span className={`${s.stroke} ${s.strokeSecond}`} />
      <span className={s.dot} />
      <RailPopover side="bottom-left">
        <strong>{def.title}</strong>
        <p>{def.desc}</p>
        <small>掉落加成 +{def.dropBonus.toFixed(2)}</small>
        {run.broken && <em>已打破 —— 本场不再获得该奖励</em>}
      </RailPopover>
    </div>
  );
}

export function ChallengeRail({ challenges }: { challenges: ChallengeRun[] }) {
  return (
    <aside className={s.rail} aria-label="挑战" onClick={(event) => event.stopPropagation()}>
      <div className={s.items}>
        {challenges.map((run) => <ChallengeItem key={run.id} run={run} />)}
      </div>
    </aside>
  );
}
