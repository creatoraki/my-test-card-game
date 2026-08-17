import { memo } from "react";
import { starlightPayment, type BattleState, type Card } from "@/engine";
import { useHandHover, useHandHoverCost } from "@/ui/battle/handFocusStore";
import { HandCard } from "@/ui/battle/HandCard";
import s from "./CardInfoPanel.module.css";

// 固定卡牌说明面板: 绝对定位在**画布右上角**, 位置恒定(取代旧的悬停跟随浮窗)。
// (它曾是底部 HUD 的第三列, 为把整列宽度让给手牌托盘而搬出, 理由见 CardInfoPanel.css。)
// 展示哪张卡仍是「悬停 ?? 选中」, 但两半来路不同: **悬停自己订阅** ui/handFocusStore.ts,
// **选中**由 BattleScreen 以 fallbackCard 传入。选中待选目标期间说明持续可见。
// ★ 悬停之所以走 store 而不是 props: 它以前是 BattleScreen 的顶层 state, 鼠标扫过手牌
//   会把整个战斗界面重渲染一遍(完整理由见 ui/handFocusStore.ts 开头)。现在悬停变化只重渲染
//   本组件与 AllyBar 的一格。选中变化频率低, 继续走 props 即可。
// 无卡时不渲染占位面板, 让战斗画面把注意力还给场景。
// 内容直接复用 HandCard, 保证详情卡面的排版与手牌一致。
//
// ★ 面板宽 320 = --hud-info-w, 高为 320 × 1.4(卡牌比例), 顶边锁定在 y=108, 底边落在 y=556。
// ⚠ 两个分支的根节点都要自己 stopPropagation: 面板已搬出 .battle-hud(那层统一拦了冒泡), 现在
//   直挂在 .screen.battle 下, 不拦的话点面板会冒泡到画布的 onClick 把选中的卡取消掉。
export const CardInfoPanel = memo(function CardInfoPanel({
  battle,
  fallbackCard,
  fallbackCost,
}: {
  battle: BattleState;
  fallbackCard: Card | null;
  fallbackCost?: number;
}) {
  // ⚠ hook 必须在下面的早退**之前**调用。
  const hovered = useHandHover();
  const hoveredCost = useHandHoverCost();
  const card = hovered ?? fallbackCard;

  if (!card) {
    return null;
  }

  return (
    <CardInfoPanelContent
      card={card}
      cost={hovered ? hoveredCost ?? card.cost : fallbackCost}
      starPay={starlightPayment(battle, card)}
    />
  );
});

function CardInfoPanelContent({ card, cost, starPay }: { card: Card; cost?: number; starPay: number }) {
  return (
    <div
      className={s["card-info-panel"]}
      aria-hidden
      onClick={(e) => e.stopPropagation()}
    >
      <div className={s["cip-scale"]} data-card-detail>
        <HandCard
          card={card}
          variant="pile"
          playable
          selected={false}
          cost={cost ?? card.cost}
          starPay={starPay}
        />
      </div>
    </div>
  );
}
