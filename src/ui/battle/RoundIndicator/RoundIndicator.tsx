import type { Enemy } from "@/engine";
import { TickRuler } from "@/ui/battle/TickRuler";
import s from "./RoundIndicator.module.css";

interface Props {
  round: number;
  maxRound: number;
  tick: number;
  enemies: Enemy[];
}

export function RoundIndicator({ round, maxRound, tick, enemies }: Props) {
  return (
    <div className={s.indicator} aria-label="回合仪表">
      <div className={s.roundReadout}>
        <span>ROUND</span>
        <b>{String(round).padStart(2, "0")}</b>
        <i>/</i>
        <b>{String(maxRound).padStart(2, "0")}</b>
      </div>
      <div className={s.roundTicks} aria-hidden>
        {Array.from({ length: maxRound }, (_, index) => (
          <span key={index} className={index < round ? s.roundTickActive : ""} />
        ))}
      </div>
      <div className={s.tickRuler}>
        <TickRuler tick={tick} enemies={enemies} />
      </div>
    </div>
  );
}
