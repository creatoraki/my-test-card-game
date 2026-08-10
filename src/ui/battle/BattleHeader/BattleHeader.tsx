import type { Enemy } from "@/engine";
import { TickRuler } from "@/ui/battle/TickRuler";
import s from "./BattleHeader.module.css";

interface Props {
  round: number;
  maxRound: number;
  tick: number;
  enemies: Enemy[];
  encounterName: string;
  canEndTurn: boolean;
  onEndTurn: () => void;
}

export function BattleHeader({
  round,
  maxRound,
  tick,
  enemies,
  encounterName,
  canEndTurn,
  onEndTurn,
}: Props) {
  return (
    <header className={s.header} role="toolbar" aria-label="战斗仪表">
      <div className={s.backplate} aria-hidden />
      <div className={s.encounterTag} title={encounterName}>
        <span className={s.tagMark}>◈</span>
        <span>{encounterName}</span>
      </div>
      <div className={s.arch}>
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
        <TickRuler tick={tick} enemies={enemies} />
      </div>
      <div className={s.actions}>
        <button
          className={s.endTurn}
          type="button"
          disabled={!canEndTurn}
          onClick={(event) => {
            event.stopPropagation();
            onEndTurn();
          }}
        >
          结束回合
        </button>
        <button className={s.settings} type="button" aria-label="设置" title="设置" onClick={(event) => event.stopPropagation()}>
          ⚙
        </button>
      </div>
    </header>
  );
}
