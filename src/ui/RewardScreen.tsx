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
    <div className="screen reward terminal-screen center">
      <div className="screen-kicker">战后处理 / 阶段 {String(index + 1).padStart(2, "0")}</div>
      <h2 className="terminal-heading">区域已清除</h2>
      <p className="muted">战术数据已归档。选择一项增幅协议。</p>

      <div className="reward-cards">
        {rewardCards.map((id) => {
          const def = getCardDef(id);
          const display: Card = { ...def, uid: id, upgraded: false };
          return (
            <div key={id} className="reward-choice">
              <span className="choice-index">MOD-{String(rewardCards.indexOf(id) + 1).padStart(2, "0")}</span>
              <CardView card={display} playable selected={false} onClick={() => addCard(id)} />
              <button className="primary" onClick={() => addCard(id)}>
                加入卡组
              </button>
            </div>
          );
        })}
      </div>

      <div className="reward-actions">
        <button onClick={() => upgradeRandom()}>强化随机行动卡</button>
        <button onClick={() => skipReward()}>跳过增幅</button>
      </div>
    </div>
  );
}
