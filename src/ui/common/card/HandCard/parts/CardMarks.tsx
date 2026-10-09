import type { Card } from "@/engine";
import { CARD_MARK_DEFS, cultivateReady, cultivateWitherSoon } from "@/engine";
import { cardMarkArtOf } from "@/ui/art/battle/cardMarkArt";
import { CULTIVATION_ART, CULTIVATED_ART } from "@/ui/art/battle/buffArt";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import s from "./CardMarks.module.css";

interface Props {
  card: Card;
  variant: "hand" | "pile";
  actionBadge?: "redraw" | "discard" | "choose" | null;
  leaving?: boolean;
}

export function cultivateTip(card: Card): string {
  const left = card.cultivateLeft ?? card.cultivate?.turns ?? 0;
  if (card.grafted)
    return cultivateReady(card)
      ? "已成熟：打出时该牌所属角色攻击力、治愈力 +40%。嫁接牌不会枯萎。"
      : `还需经过 ${left} 个回合成熟；成熟后打出时所属角色攻击力、治愈力 +40%，且不会枯萎。`;
  if (cultivateWitherSoon(card)) return "已成熟，即将枯萎：打出时触发成熟效果；本回合结束时仍在手牌中会枯萎，变为枯萎的果实。";
  if (cultivateReady(card)) return "已成熟：打出时触发成熟效果。成熟维持到下一个回合结束。";
  return `还需经过 ${left} 个回合。`;
}

export function CardMarks({ card, variant, actionBadge, leaving }: Props) {
  if (variant === "pile") {
    return (
      <>
        {card.marks?.map((markId) => {
          const mark = CARD_MARK_DEFS[markId];
          if (!mark) return null;
          const art = cardMarkArtOf(markId);
          return (
            <span key={markId} className={s["hc-mark-inline"]} data-hand-mark-inline aria-label={mark.name}>
              {art ? <img src={art} alt="" aria-hidden="true" /> : mark.emoji}
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
            const art = cardMarkArtOf(markId);
            return (
              <span key={markId} className={s["hc-mark"]} aria-label={mark.name}>
                <span className={s["hc-mark-icon"]} aria-hidden>
                  {art ? <img className={s["hc-mark-art"]} src={art} alt="" /> : mark.emoji}
                </span>
                <span className={s["hc-mark-tip"]} role="tooltip">
                  <TooltipCard
                    icon={art ? <img src={art} alt="" /> : mark.emoji}
                    title={mark.name}
                    desc={markId === "returnTax"
                      ? `当前 ${card.costStacks ?? 0} 层：本卡费用 +${card.costStacks ?? 0}。每次回手继续叠加，本回合结束时移除。`
                      : mark.desc}
                  />
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
          <span className={`${s["hc-mark"]}${cultivateReady(card) ? ` ${s["hc-cultivate-ready"]}` : ""}${cultivateWitherSoon(card) ? ` ${s["hc-cultivate-wither"]}` : ""}`} aria-label="培育">
            <span className={`${s["hc-mark-icon"]} ${s["hc-cultivate-icon"]}`} aria-hidden>
              <img
                className={s["hc-cultivate-emblem"]}
                src={cultivateReady(card) ? CULTIVATED_ART : CULTIVATION_ART}
                alt=""
              />
              {!cultivateReady(card) && (
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
