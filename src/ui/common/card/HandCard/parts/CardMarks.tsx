import type { Card } from "@/engine";
import { CARD_MARK_DEFS, cultivateOverripe, cultivateReady } from "@/engine";
import { CultivatedEmblem } from "@/ui/common/icon/BuffIcon";
import { CULTIVATION_ART } from "@/ui/art/battle/buffArt";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import s from "./CardMarks.module.css";

interface Props {
  card: Card;
  variant: "hand" | "pile";
  actionBadge?: "redraw" | "discard" | "choose" | null;
  leaving?: boolean;
}

function cultivateTip(card: Card): string {
  const left = card.cultivateLeft ?? card.cultivate?.turns ?? 0;
  if (card.grafted)
    return cultivateReady(card)
      ? "已成熟：打出时本牌数值 +40%。嫁接牌不会过熟。"
      : `还需经过 ${left} 个回合成熟；成熟后本牌数值 +40%，且不会过熟。`;
  if (cultivateOverripe(card)) return "已过熟：打出时结算过熟效果；本回合结束时仍在手牌中会腐烂。";
  if (cultivateReady(card))
    return card.cultivate?.evergreen
      ? "已就绪：打出时触发额外效果。常青：不会过熟；留在手牌中每回合开始结算常青效果。"
      : "已就绪：打出时触发额外效果。";
  return `还需经过 ${left} 个回合。`;
}

export function CardMarks({ card, variant, actionBadge, leaving }: Props) {
  if (variant === "pile") {
    return (
      <>
        {card.marks?.map((markId) => {
          const mark = CARD_MARK_DEFS[markId];
          if (!mark) return null;
          return (
            <span key={markId} className={s["hc-mark-inline"]} aria-label={mark.name}>
              {mark.emoji}
            </span>
          );
        })}
      </>
    );
  }

  if (leaving) return null;
  // 换牌/丢弃/选择模式只隐藏、不卸载: 卸载后退出模式会重新挂载, 发牌飞入动画(hc-marks-deal-in)会再播一遍。
  const hidden = actionBadge ? true : undefined;

  return (
    <>
      {(card.marks?.length ?? 0) > 0 && (
        <span className={s["hc-marks"]} data-card-marks data-hidden={hidden}>
          {card.marks!.map((markId) => {
            const mark = CARD_MARK_DEFS[markId];
            if (!mark) return null;
            return (
              <span key={markId} className={s["hc-mark"]} aria-label={mark.name}>
                <span className={s["hc-mark-icon"]} aria-hidden>{mark.emoji}</span>
                <span className={s["hc-mark-tip"]} role="tooltip">
                  <TooltipCard icon={mark.emoji} title={mark.name} desc={mark.desc} />
                </span>
              </span>
            );
          })}
        </span>
      )}
      {card.cultivate && (
        <span
          className={`${s["hc-marks"]}${(card.marks?.length ?? 0) > 0 ? ` ${s["hc-cultivate-row"]}` : ""}`}
          data-card-marks
          data-hidden={hidden}
        >
          <span className={`${s["hc-mark"]}${cultivateReady(card) ? ` ${s["hc-cultivate-ready"]}` : ""}${cultivateOverripe(card) ? ` ${s["hc-cultivate-overripe"]}` : ""}`} aria-label="培育">
            <span className={`${s["hc-mark-icon"]} ${s["hc-cultivate-icon"]}`} aria-hidden>
              {cultivateReady(card) || cultivateOverripe(card) ? (
                <CultivatedEmblem className={s["hc-cultivate-emblem"]} label={null} />
              ) : (
                <img className={s["hc-cultivate-emblem"]} src={CULTIVATION_ART} alt="" />
              )}
              {!cultivateReady(card) && !cultivateOverripe(card) && (
                <span className={s["hc-mark-count"]}>{card.cultivateLeft ?? card.cultivate.turns}</span>
              )}
            </span>
            <span className={s["hc-mark-tip"]} role="tooltip">
              <TooltipCard
                title={card.grafted ? "嫁接" : "培育"}
                desc={cultivateTip(card)}
              />
            </span>
          </span>
        </span>
      )}
    </>
  );
}
