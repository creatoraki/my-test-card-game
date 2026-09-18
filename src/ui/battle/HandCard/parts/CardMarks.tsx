import type { Card } from "@/engine";
import { CARD_MARK_DEFS, cultivateOverripe, cultivateReady } from "@/engine";
import { CultivatedEmblem } from "@/ui/common/BuffIcon";
import { CULTIVATION_ART } from "@/ui/art/buffArt";
import s from "./CardMarks.module.css";

interface Props {
  card: Card;
  variant: "hand" | "pile";
  actionBadge?: "redraw" | "discard" | "choose" | null;
  leaving?: boolean;
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

  if (actionBadge || leaving) return null;

  return (
    <>
      {(card.marks?.length ?? 0) > 0 && (
        <span className={s["hc-marks"]} data-card-marks>
          {card.marks!.map((markId) => {
            const mark = CARD_MARK_DEFS[markId];
            if (!mark) return null;
            return (
              <span key={markId} className={s["hc-mark"]} aria-label={mark.name}>
                <span className={s["hc-mark-icon"]} aria-hidden>{mark.emoji}</span>
                <span className={s["hc-mark-tip"]} role="tooltip">
                  <span className={s["hc-mark-tip-name"]}>{mark.emoji} {mark.name}</span>
                  <span className={s["hc-mark-tip-desc"]}>{mark.desc}</span>
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
              <span className={s["hc-mark-tip-name"]}>培育</span>
              <span className={s["hc-mark-tip-desc"]}>
                {cultivateOverripe(card)
                  ? "已过熟：打出时结算过熟效果；本回合结束时仍在手牌中会腐烂。"
                  : cultivateReady(card)
                  ? "已就绪：打出时触发额外效果。"
                  : `还需经过 ${card.cultivateLeft ?? card.cultivate.turns} 个回合。`}
              </span>
            </span>
          </span>
        </span>
      )}
    </>
  );
}
