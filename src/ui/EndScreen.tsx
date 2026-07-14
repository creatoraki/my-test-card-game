import { RUN_SEQUENCE } from "../data";
import { useRunStore } from "../store/runStore";

export function EndScreen({ win }: { win: boolean }) {
  const deck = useRunStore((s) => s.deck);
  const index = useRunStore((s) => s.index);
  const backToMenu = useRunStore((s) => s.backToMenu);

  return (
    <div className="screen end center">
      <h1 className="title">{win ? "🏆 远征成功!" : "💀 远征失败"}</h1>
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
