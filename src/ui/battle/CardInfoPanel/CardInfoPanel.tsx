import type { Card, Targeting, Rarity } from "@/engine";
import { getCharacter } from "@/data";
import { cardArt } from "@/ui/art/cardArt";
import { useHandHover } from "@/ui/battle/handFocusStore";
import { cx } from "@/ui/common/cx";
import s from "./CardInfoPanel.module.css";

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

// 固定卡牌说明面板: 绝对定位在**画布右上角**, 位置恒定(取代旧的悬停跟随浮窗)。
// (它曾是底部 HUD 的第三列, 为把整列宽度让给手牌托盘而搬出, 理由见 CardInfoPanel.css。)
// 展示哪张卡仍是「悬停 ?? 选中」, 但两半来路不同: **悬停自己订阅** ui/handFocusStore.ts,
// **选中**由 BattleScreen 以 fallbackCard 传入。选中待选目标期间说明持续可见。
// ★ 悬停之所以走 store 而不是 props: 它以前是 BattleScreen 的顶层 state, 鼠标扫过手牌
//   会把整个战斗界面重渲染一遍(完整理由见 ui/handFocusStore.ts 开头)。现在悬停变化只重渲染
//   本组件与 AllyBar 的一格。选中变化频率低, 继续走 props 即可。
// 无卡时渲染科幻待机占位而不是收起面板, 版面因此永远稳定。
// 内容复用 .drawer-* 类(与 .card-drawer 共用), 样式覆盖 scoped 在 .card-info-panel 下。
//
// ★ 面板宽高比恒为 1:2(320×640, 见 CardInfoPanel.css .card-info-panel), 结构因此是「上半一张与
//   面板同宽的 1:1 大卡面 + 下半卡名/元数据/描述」—— 卡面素材本就是方图, 比例是从这里推出来的。
//   面板底边(y=720)与手牌静止时的上沿正好在同一条线上。
// ⚠ 无配图的卡渲染同尺寸的 NO VISUAL 占位而不是不渲染: 否则那个 296px 见方的块会塌掉,
//   悬停不同卡时下半部整块上下跳。
// ⚠ 两个分支的根节点都要自己 stopPropagation: 面板已搬出 .battle-hud(那层统一拦了冒泡), 现在
//   直挂在 .screen.battle 下, 不拦的话点面板会冒泡到画布的 onClick 把选中的卡取消掉。
export function CardInfoPanel({ fallbackCard }: { fallbackCard: Card | null }) {
  // ⚠ hook 必须在下面的早退**之前**调用。
  const hovered = useHandHover();
  const card = hovered ?? fallbackCard;

  if (!card) {
    return (
      <div className={cx(s["card-info-panel"], s.empty)} aria-hidden onClick={(e) => e.stopPropagation()}>
        <div className={s["drawer-title"]}>战术数据 / 卡牌详情</div>
        <div className={s["cip-standby"]}>
          <span className={s["cip-standby-code"]}>STANDBY</span>
          <span className={s["cip-standby-hint"]}>悬停手牌查看战术数据</span>
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
      className={s["card-info-panel"]}
      style={{ "--owner-color": owner.color } as React.CSSProperties}
      aria-hidden
      onClick={(e) => e.stopPropagation()}
    >
      {/* <div className={s["drawer-title"]}>战术数据 / 卡牌详情</div> */}

      {/* 上半部: 与面板同宽的 1:1 大卡面(无图走同尺寸占位, 保住版面高度) */}
      {art ? (
        <img className={s["cip-art"]} src={art} alt={`${card.name}卡面`} />
      ) : (
        <div className={cx(s["cip-art"], s.empty)} aria-hidden>
          <span>NO VISUAL</span>
        </div>
      )}

      {/* 图下一行: 卡名 + 普/速副标题 */}
      <div className={s["cip-id"]}>
        <span className={s["cip-name"]}>{card.name}</span>
        <span className={s["cip-sub"]}>
          {card.cardType === "fast" ? "速攻 · 不推进时刻" : "普通 · 推进 1 时刻"}
          {card.upgraded ? " · 已强化" : ""}
          {card.contaminated ? " · 污染卡" : ""}
        </span>
      </div>

      <dl className={s["drawer-meta"]}>
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
        {card.contaminated && (
          <div>
            <dt>污染效果</dt>
            <dd>抽到时所属角色污染值 +2</dd>
          </div>
        )}
      </dl>

      <div className={s["drawer-text"]}>{card.text}</div>
    </div>
  );
}
