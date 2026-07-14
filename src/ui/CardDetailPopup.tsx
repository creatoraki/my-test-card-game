import { useLayoutEffect, useRef, useState } from "react";
import type { Card, Targeting, Rarity } from "../engine";
import { cardArt } from "./cardArt";

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

const OFFSET = 52; // 浮窗与卡牌的间距
const MARGIN = 8; // 与视口边缘的最小间距

// 卡牌右侧的详情浮窗: 悬浮某张手牌时在该卡右侧展示完整信息。
// 宽度固定、高度由内容撑开; 靠近视口边缘时自动翻转/收拢。
export function CardDetailPopup({ card, anchor }: { card: Card | null; anchor: DOMRect | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (ref.current) {
      setDims({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
    }
  }, [card]);

  if (!card || !anchor) return null;

  const art = cardArt(card.id);
  const hasAllFoesEffect = card.effects.some((effect) => effect.target === "allFoes");
  const hasAllAlliesEffect = card.effects.some((effect) => effect.target === "allAllies");

  // 默认贴在卡牌右侧、顶部对齐; 右侧放不下则翻到卡牌左侧, 底部越界则上收。
  let left = anchor.right + OFFSET;
  if (dims.w && left + dims.w > window.innerWidth - MARGIN) {
    left = anchor.left - OFFSET - dims.w;
  }
  if (left < MARGIN) left = MARGIN;
  let top = anchor.top;
  if (dims.h && top + dims.h > window.innerHeight - MARGIN) {
    top = window.innerHeight - MARGIN - dims.h;
  }
  if (top < MARGIN) top = MARGIN;

  return (
    <div ref={ref} className="card-popup" style={{ left, top }} aria-hidden>
      <div className="drawer-title">战术数据 / 卡牌详情</div>
      {art && <img className="drawer-card-art" src={art} alt={`${card.name}卡牌全图`} />}
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
          <dt>施放确认</dt>
          <dd>{TARGET_LABEL[card.targeting]}</dd>
        </div>
        {(hasAllFoesEffect || hasAllAlliesEffect) && (
          <div>
            <dt>作用范围</dt>
            <dd>{hasAllFoesEffect ? "全体敌人" : "全体友军"}</dd>
          </div>
        )}
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
    </div>
  );
}
