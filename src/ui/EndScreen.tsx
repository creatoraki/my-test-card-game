import { RUN_SEQUENCE } from "../data";
import { useRunStore } from "../store/runStore";

export function EndScreen({ win }: { win: boolean }) {
  const deck = useRunStore((s) => s.deck);
  const index = useRunStore((s) => s.index);
  const backToMenu = useRunStore((s) => s.backToMenu);

  return (
    <div className="screen end terminal-screen center">
      <div className="screen-kicker">远征终端 / 最终报告</div>
      <h1 className="terminal-heading">{win ? "远征完成" : "远征中断"}</h1>
      <p className="muted">
        {win
          ? `通关全部 ${RUN_SEQUENCE.length} 场战斗。`
          : `倒在了第 ${index + 1} / ${RUN_SEQUENCE.length} 场战斗。`}
      </p>

      <div className="deck-summary">
        <h3>最终卡组({deck.length} 张)</h3>
        <div className="deck-list">
          {deck.map((c) => (
            <span key={c.uid} className={`deck-chip ${c.upgraded ? "upgraded" : ""}`}>
              {c.name}
            </span>
          ))}
        </div>
      </div>

      <button className="primary big" onClick={() => backToMenu()}>
        返回主菜单
      </button>
    </div>
  );
}
