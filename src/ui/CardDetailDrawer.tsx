import type { Card, Targeting, Rarity } from "../engine";
import { CardView } from "./CardView";

const TARGET_LABEL: Record<Targeting, string> = {
  foe: "敌方单体",
  ally: "友方单体",
  self: "自身",
  allFoes: "全体敌人",
  allAllies: "全体友军",
  none: "无需目标",
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: "普通",
  uncommon: "优秀",
  rare: "稀有",
};

// 右侧详情抽屉: 悬浮/选中某张手牌时滑出, 展示该卡的完整信息。
export function CardDetailDrawer({ card }: { card: Card | null }) {
  return (
    <aside className={`card-drawer ${card ? "open" : ""}`} aria-hidden={!card}>
      {card && (
        <>
          <div className="drawer-title">卡牌详情</div>
          <CardView card={card} playable selected={false} />
          <dl className="drawer-meta">
            <div>
              <dt>消耗</dt>
              <dd>{card.cost} 点法力水晶</dd>
            </div>
            <div>
              <dt>类型</dt>
              <dd>{card.cardType === "fast" ? "速攻 · 不推进时刻" : "普通 · 推进 1 时刻"}</dd>
            </div>
            <div>
              <dt>目标</dt>
              <dd>{TARGET_LABEL[card.targeting]}</dd>
            </div>
            {card.rarity && (
              <div>
                <dt>稀有度</dt>
                <dd>{RARITY_LABEL[card.rarity]}</dd>
              </div>
            )}
            {card.exhaust && (
              <div>
                <dt>消耗</dt>
                <dd>打出后本场移除</dd>
              </div>
            )}
          </dl>
          <div className="drawer-text">{card.text}</div>
        </>
      )}
    </aside>
  );
}
