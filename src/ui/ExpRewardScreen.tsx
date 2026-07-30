// 战后小结 —— 一场战斗结束后的收获报告, 确认后回到路由图(BOSS 战则进最终结算)。
// 经验按能量档位倍率**即时入账**; 实物与积分相反, 要活着回城才落袋 —— 这是「撤离」成为真选择的原因。
//
// ⚠ 设计文档 §6.1: 战斗胜利**只掉物品, 绝不直接掉居民积分**。所以这一页的主角是掉落列表,
//   积分那一行只有 BOSS 通关奖励时才会出现。

import { getCharacter, getItemDef } from "../data";
import { energyTier } from "../explore/session";
import { EXPLORE_RULES } from "../explore/rules";
import { useExploreStore } from "../store/exploreStore";
import { useRunStore } from "../store/runStore";
import { CharacterPortrait } from "./CharacterPortrait";
import ItemSlot from "./ItemSlot";
import "./ExpRewardScreen.css";

export function ExpRewardScreen() {
  const expReport = useRunStore((s) => s.expReport);
  const confirmExpReport = useRunStore((s) => s.confirmExpReport);
  const lastLoot = useRunStore((s) => s.lastLoot);
  const lastDrops = useRunStore((s) => s.lastDrops);
  const session = useExploreStore((s) => s.session);

  // 会话已被清掉时(理论上到不了这一页)按满能量算, 只影响这行标题文字。
  const tier = energyTier(session?.energy ?? EXPLORE_RULES.energyMax);
  const isBossDone = session?.phase === "cleared";
  const overflowed = (session?.pendingPickup.length ?? 0) > 0;

  return (
    <div className="screen reward terminal-screen center">
      <div className="screen-kicker">
        战后处理 / 净化粒子〈{tier.name}〉×{tier.rewardMultiplier.toFixed(2)}
      </div>
      <h2 className="terminal-heading">{isBossDone ? "回收总控已停机" : "遭遇已清除"}</h2>
      <p className="muted">
        {lastLoot > 0 && (
          <>
            本场缴获 <b className="loot-inline">💠 {lastLoot}</b> 居民积分
            {isBossDone ? "。" : "（撤离或通关时才落袋）。"}{" "}
          </>
        )}
        经验已同步至上阵队员。
      </p>

      {/* 掉落。⚠ 这里只是**展示**, 东西已经在背包里了(finishBattle 就收进去了)。 */}
      {lastDrops.length > 0 && (
        <div className="reward-drops">
          <span className="screen-kicker">战利品</span>
          <div className="reward-drop-row">
            {lastDrops.map((st) => (
              <ItemSlot key={st.uid} stack={st} span={getItemDef(st.itemId).slots} />
            ))}
          </div>
          {overflowed && (
            <p className="muted">背包装不下 —— 回到路由图后要当场取舍。</p>
          )}
        </div>
      )}

      <div className="exp-report">
        {/* ★ 角色没有等级 —— 经验只是进池子, 等玩家拿去训练室锻造卡组。
            所以这里既没有升级提示, 也没有"距下一级还差多少"的进度条。 */}
        {expReport.map((g) => {
          const c = getCharacter(g.charId);
          return (
            <div key={g.charId} className="exp-row">
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
                <div className="exp-level-line">
                  <span className="muted">可用经验 {g.expAfter} · 用于卡组锻造</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="primary big" onClick={() => confirmExpReport()}>
        {isBossDone ? "完成远征" : "回到路由图"}
      </button>
    </div>
  );
}
