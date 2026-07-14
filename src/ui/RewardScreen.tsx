import type { Card } from "../engine";
import { getCardDef } from "../data";
import { useRunStore } from "../store/runStore";
import { CardView } from "./CardView";

export function RewardScreen() {
  const rewardCards = useRunStore((s) => s.rewardCards);
  const addCard = useRunStore((s) => s.addCard);
  const upgradeRandom = useRunStore((s) => s.upgradeRandom);
  const skipReward = useRunStore((s) => s.skipReward);
  const index = useRunStore((s) => s.index);

  return (
    <div className="screen reward center">
      <h2>🎉 战斗胜利!</h2>
      <p className="muted">已通过第 {index + 1} 场战斗 · 选择一项奖励</p>

      <div className="reward-cards">
        {rewardCards.map((id) => {
          const def = getCardDef(id);
          const display: Card = { ...def, uid: id, upgraded: false };
          return (
            <div key={id} className="reward-choice">
              <CardView card={display} playable selected={false} onClick={() => addCard(id)} />
              <button className="primary" onClick={() => addCard(id)}>
                加入卡组
              </button>
            </div>
          );
        })}
      </div>

      <div className="reward-actions">
        <button onClick={() => upgradeRandom()}>🔧 强化一张随机牌</button>
        <button onClick={() => skipReward()}>跳过</button>
      </div>
    </div>
  );
}
