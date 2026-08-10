import s from "./BattleActions.module.css";

interface Props {
  canEndTurn: boolean;
  onEndTurn: () => void;
}

export function BattleActions({ canEndTurn, onEndTurn }: Props) {
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
      <button className={s.settings} type="button" aria-label="设置" title="设置" onClick={(event) => event.stopPropagation()}>
        ⚙
      </button>
    </div>
  );
}
