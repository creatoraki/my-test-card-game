// 战后经验结算页 —— 取代旧的三选一选卡奖励(战斗不再产出卡牌)。
// 展示本场每个上阵角色的经验入账与升级情况, 确认后进入下一场。

import { getCharacter } from "../data";
import { useRunStore } from "../store/runStore";
import { CharacterPortrait } from "./CharacterPortrait";

export function ExpRewardScreen() {
  const expReport = useRunStore((s) => s.expReport);
  const confirmExpReport = useRunStore((s) => s.confirmExpReport);
  const index = useRunStore((s) => s.index);

  return (
    <div className="screen reward terminal-screen center">
      <div className="screen-kicker">战后处理 / 阶段 {String(index + 1).padStart(2, "0")}</div>
      <h2 className="terminal-heading">区域已清除</h2>
      <p className="muted">战斗经验已同步至上阵队员。属性点可回城后在「编队」分配。</p>

      <div className="exp-report">
        {expReport.map((g) => {
          const c = getCharacter(g.charId);
          const leveled = g.toLevel > g.fromLevel;
          return (
            <div key={g.charId} className={`exp-row ${leveled ? "leveled" : ""}`}>
              <CharacterPortrait
                characterId={c.id}
                emoji={c.emoji}
                alt={c.name}
                className="exp-portrait"
              />
              <div className="exp-info">
                <div className="exp-name-line">
                  <span className="exp-name">{c.name}</span>
                  <span className="exp-gain">+{g.gained} EXP</span>
                </div>
                <div className="exp-bar">
                  <div
                    className="exp-bar-fill"
                    style={{ width: `${Math.min(100, (g.expAfter / g.expToNextAfter) * 100)}%` }}
                  />
                </div>
                <div className="exp-level-line">
                  {leveled ? (
                    <span className="exp-levelup">
                      LV {g.fromLevel} → {g.toLevel} · 属性点 +{g.pointsGained}
                    </span>
                  ) : (
                    <span className="muted">
                      LV {g.toLevel} · {g.expAfter}/{g.expToNextAfter}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="primary big" onClick={() => confirmExpReport()}>
        继续推进
      </button>
    </div>
  );
}
