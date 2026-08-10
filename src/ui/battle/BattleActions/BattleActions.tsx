import s from "./BattleActions.module.css";

interface Props {
  canEndTurn: boolean;
  onEndTurn: () => void;
  speed2x: boolean;
  onToggleSpeed: () => void;
}

export function BattleActions({ canEndTurn, onEndTurn, speed2x, onToggleSpeed }: Props) {
  return (
    <div className={s.actions} role="toolbar" aria-label="战斗操作">
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
      <button
        className={s.speed}
        type="button"
        aria-pressed={speed2x}
        aria-label="切换 2 倍演出速度"
        title="2 倍演出速度"
        onClick={(event) => {
          event.stopPropagation();
          onToggleSpeed();
        }}
      >
        2×
      </button>
      <button className={s.settings} type="button" aria-label="设置" title="设置" onClick={(event) => event.stopPropagation()}>
        ⚙
      </button>
    </div>
  );
}
