import type { Card, Targeting, Rarity } from "../engine";
import { getCharacter } from "../data";
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

// 手牌右侧的固定卡牌说明面板: 占底部 HUD 第三列, 位置恒定(取代旧的悬停跟随浮窗)。
// 展示哪张卡由 BattleScreen 的 focusUid(悬停 ?? 选中)派生 —— 选中待选目标期间说明持续可见。
// 无卡时渲染科幻待机占位而不是收起面板, 版面因此永远稳定。
// 内容复用 .drawer-* 类(与 .card-drawer 共用), 样式覆盖 scoped 在 .card-info-panel 下。
export function CardInfoPanel({ card }: { card: Card | null }) {
  if (!card) {
    return (
      <div className="card-info-panel empty" aria-hidden>
        <div className="drawer-title">战术数据 / 卡牌详情</div>
        <div className="cip-standby">
          <span className="cip-standby-code">STANDBY</span>
          <span className="cip-standby-hint">悬停手牌查看战术数据</span>
        </div>
      </div>
    );
  }

  const owner = getCharacter(card.ownerCharId);
  const art = cardArt(card.id);
  const hasAllFoesEffect = card.effects.some((effect) => effect.target === "allFoes");
  const hasAllAlliesEffect = card.effects.some((effect) => effect.target === "allAllies");

  return (
    <div
      className="card-info-panel"
      style={{ "--owner-color": owner.color } as React.CSSProperties}
      aria-hidden
    >
      <div className="drawer-title">战术数据 / 卡牌详情</div>

      {/* 头部: 小卡面缩略图 + 卡名/类型行(面板高度钉死在 HUD 行高内, 放不下浮窗那张大图) */}
      <div className="cip-head">
        {art && <img className="cip-art" src={art} alt={`${card.name}卡面`} />}
        <div className="cip-id">
          <span className="cip-name">{card.name}</span>
          <span className="cip-sub">
            {card.cardType === "fast" ? "速攻 · 不推进时刻" : "普通 · 推进 1 时刻"}
            {card.upgraded ? " · 已强化" : ""}
          </span>
        </div>
      </div>

      <dl className="drawer-meta">
        <div>
          <dt>消耗</dt>
          <dd>{card.cost} 点法力</dd>
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
