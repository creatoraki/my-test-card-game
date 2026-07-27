// 战后小结 —— 一场战斗结束后的收获报告, 确认后回到探索牌桌(BOSS 战则进最终结算)。
// 经验按危险度倍率**即时入账**; 残片相反, 要活着回城才落袋 —— 这是「撤退」成为真选择的原因。

import { getCharacter } from "../data";
import { dangerTier } from "../explore/session";
import { useExploreStore } from "../store/exploreStore";
import { useRunStore } from "../store/runStore";
import { CharacterPortrait } from "./CharacterPortrait";
import "./ExpRewardScreen.css";

export function ExpRewardScreen() {
  const expReport = useRunStore((s) => s.expReport);
  const confirmExpReport = useRunStore((s) => s.confirmExpReport);
  const lastLoot = useRunStore((s) => s.lastLoot);
  const session = useExploreStore((s) => s.session);

  const tier = dangerTier(session?.danger ?? 0);
  const isBossDone = session?.phase === "cleared";

  return (
    <div className="screen reward terminal-screen center">
      <div className="screen-kicker">
        战后处理 / {tier.name} ×{tier.rewardMultiplier.toFixed(1)}
      </div>
      <h2 className="terminal-heading">{isBossDone ? "深处之物已清除" : "遭遇已清除"}</h2>
      <p className="muted">
        本场缴获 <b className="loot-inline">💠 {lastLoot}</b> 残片
        {isBossDone ? "。" : "（撤退或通关时才落袋）。"}
        经验已同步至上阵队员。
      </p>

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
        {isBossDone ? "完成远征" : "回到牌桌"}
      </button>
    </div>
  );
}
