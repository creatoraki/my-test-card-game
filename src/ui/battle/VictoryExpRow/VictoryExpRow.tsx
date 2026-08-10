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
  const expBefore = Math.max(0, expAfter - gained);
  const barMax = Math.max(100, Math.ceil(Math.max(expAfter, 1) / 100) * 100);
  const beforeRatio = Math.min(1, expBefore / barMax);
  const gainRatio = Math.min(1 - beforeRatio, gained / barMax);
  const displayedExp = useCountUp(
    expAfter,
    VICTORY_CHOREO.contentDelayMs + VICTORY_CHOREO.staggerMs * index + 180,
    VICTORY_CHOREO.expMs,
  );

  return (
    <article
      className={cx(s["exp-row"], !alive && s["is-dead"])}
      style={
        {
          "--vc-delay": victoryStagger(index),
          "--vc-before": beforeRatio,
          "--vc-gain": gainRatio,
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
          <div>
            <strong>{member.name}</strong>
            <span className={s["exp-label"]}>经验池</span>
          </div>
          <span className={s["exp-total"]}>{Math.round(displayedExp).toLocaleString("zh-CN")}</span>
        </div>
        <div className={s["exp-track"]} aria-label={`${member.name}经验 ${expAfter}`}>
          <span className={s["exp-before"]} />
          <span className={s["exp-gain"]} />
        </div>
        <div className={s["exp-foot"]}>
          <span>{expBefore.toLocaleString("zh-CN")} → {expAfter.toLocaleString("zh-CN")}</span>
          <b>+{gained} EXP</b>
        </div>
      </div>
    </article>
  );
}
