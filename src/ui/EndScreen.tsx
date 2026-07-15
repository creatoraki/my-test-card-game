import { getCharacter, getMap } from "../data";
import { useRunStore } from "../store/runStore";
import { useTownStore } from "../store/townStore";

export function EndScreen({ win }: { win: boolean }) {
  const characters = useTownStore((s) => s.characters);
  const party = useTownStore((s) => s.party);
  const index = useRunStore((s) => s.index);
  const mapId = useRunStore((s) => s.mapId);
  const expReport = useRunStore((s) => s.expReport);
  const backToTown = useRunStore((s) => s.backToTown);

  const map = mapId ? getMap(mapId) : null;
  const total = map?.sequence.length ?? 0;
  const leveledUp = expReport.some((g) => g.toLevel > g.fromLevel);

  return (
    <div className="screen end terminal-screen center">
      <div className="screen-kicker">远征终端 / 最终报告</div>
      <h1 className="terminal-heading">{win ? "远征完成" : "远征中断"}</h1>
      <p className="muted">
        {win
          ? `${map?.name ?? "未知区域"} —— 通关全部 ${total} 场战斗。`
          : `${map?.name ?? "未知区域"} —— 倒在了第 ${index + 1} / ${total} 场战斗。`}
      </p>
      {win && (
        <p className="muted">
          最终战经验已入账{leveledUp ? "，有队员升级了" : ""}，回城后可在「编队」分配属性点。
        </p>
      )}

      <div className="deck-summary">
        {party.map((id) => {
          const cs = characters[id];
          if (!cs) return null;
          const c = getCharacter(id);
          return (
            <div key={id} className="deck-summary-char">
              <h3>
                {c.emoji} {c.name} · LV {cs.level} · 个人卡组({cs.deck.length} 张)
              </h3>
              <div className="deck-list">
                {cs.deck.map((card) => (
                  <span key={card.uid} className={`deck-chip ${card.upgraded ? "upgraded" : ""}`}>
                    {card.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button className="primary big" onClick={() => backToTown()}>
        返回城镇
      </button>
    </div>
  );
}
