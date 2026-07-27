import type { Card, Targeting, Rarity } from "../engine";
import { getCharacter } from "../data";
import { cardArt } from "./cardArt";
import "./CardInfoPanel.css";

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
//
// ★ 面板宽高比恒为 1:2(320×640, 见 CardInfoPanel.css .card-info-panel), 结构因此是「上半一张与
//   面板同宽的 1:1 大卡面 + 下半卡名/元数据/描述」—— 卡面素材本就是方图, 比例是从这里推出来的。
//   面板比 HUD 行高(264)高得多, 多出来的部分向上溢出到场景里。
// ⚠ 无配图的卡渲染同尺寸的 NO VISUAL 占位而不是不渲染: 否则那个 296px 见方的块会塌掉,
//   悬停不同卡时下半部整块上下跳。
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
      {/* <div className="drawer-title">战术数据 / 卡牌详情</div> */}

      {/* 上半部: 与面板同宽的 1:1 大卡面(无图走同尺寸占位, 保住版面高度) */}
      {art ? (
        <img className="cip-art" src={art} alt={`${card.name}卡面`} />
      ) : (
        <div className="cip-art empty" aria-hidden>
          <span>NO VISUAL</span>
        </div>
      )}

      {/* 图下一行: 卡名 + 普/速副标题 */}
      <div className="cip-id">
        <span className="cip-name">{card.name}</span>
        <span className="cip-sub">
          {card.cardType === "fast" ? "速攻 · 不推进时刻" : "普通 · 推进 1 时刻"}
          {card.upgraded ? " · 已强化" : ""}
        </span>
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
