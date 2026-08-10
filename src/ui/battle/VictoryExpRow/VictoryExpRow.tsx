import type { CSSProperties } from "react";
import type { ExpGain } from "@/store/townStore";
import type { PartySnapshot } from "@/explore/types";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { cx } from "@/ui/common/cx";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { VICTORY_CHOREO, victoryStagger } from "@/ui/battle/victoryChoreo";
import s from "./VictoryExpRow.module.css";

interface Props {
  member: PartySnapshot;
  gain: ExpGain | null;
  fallbackExp: number;
  index: number;
}

export function VictoryExpRow({ member, gain, fallbackExp, index }: Props) {
  const alive = member.alive;
  const gained = alive ? gain?.gained ?? 0 : 0;
  const expAfter = gain?.expAfter ?? fallbackExp;
  const displayedExp = useCountUp(
    expAfter,
    VICTORY_CHOREO.contentDelayMs + VICTORY_CHOREO.staggerMs * index + VICTORY_CHOREO.barDelayMs,
    VICTORY_CHOREO.barMs,
  );

  return (
    <article
      className={cx(s["exp-row"], !alive && s["is-dead"])}
      style={
        {
          "--vc-delay": `${VICTORY_CHOREO.contentDelayMs + Number.parseFloat(victoryStagger(index))}ms`,
          "--vc-before": 0,
          "--vc-gain": alive && gained > 0 ? 1 : 0,
        } as CSSProperties
      }
    >
      <div className={s["portrait-frame"]}>
        <CharacterPortrait
          characterId={member.charId}
          emoji={member.emoji}
          alt={`${member.name}头像`}
          className={s["portrait"]}
        />
        {!alive && <span className={s["dead-mark"]}>阵亡</span>}
      </div>
      <div className={s["exp-main"]}>
        <div className={s["exp-heading"]}>
          <strong>{member.name}</strong>
          <b className={s["exp-gained"]}>+{gained} EXP</b>
        </div>
        <div className={s["exp-track"]} aria-label={`${member.name}经验 ${expAfter}`}>
          <span className={s["exp-gain"]} />
        </div>
        <div className={s["exp-total"]}>{Math.round(displayedExp).toLocaleString("zh-CN")}</div>
      </div>
    </article>
  );
}
