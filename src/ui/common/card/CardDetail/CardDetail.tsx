// 卡牌详情(放大卡面 + 词条释义): 战斗右上角 CardInfoPanel 与卡牌奖励三选一弹窗共用。
// 本组件只管内容与自身排版(文档流), 版面坐标由使用方通过 className 给出。
import { memo } from "react";
import type { Card } from "@/engine";
import { HandCard } from "@/ui/common/card/HandCard";
import { CardKeywordNotes } from "@/ui/common/card/CardKeywordNotes";
import { useCardText } from "@/ui/common/shared/cardTextFormat";
import { cx } from "@/ui/common/shared/cx";
import s from "./CardDetail.module.css";

const POLLUTION_NOTE = [{ id: "pollution", name: "污染", desc: "抽到这张牌时污染值 +2" }];

interface Props {
  card: Card;
  cost?: number;
  starPay?: number;
  activated?: boolean;
  className?: string;
}

export const CardDetail = memo(function CardDetail({ card, cost, starPay = 0, activated, className }: Props) {
  const text = useCardText(card);

  return (
    <div className={cx(s.detail, className)} aria-hidden>
      <div className={s.frame}>
        <div className={s.scale} data-card-detail>
          <HandCard
            card={card}
            variant="pile"
            playable
            selected={false}
            cost={cost ?? card.cost}
            starPay={starPay}
            activated={activated}
          />
        </div>
      </div>
      <CardKeywordNotes
        text={text}
        card={card}
        className={s.keywords}
        additionalNotes={card.contaminated ? POLLUTION_NOTE : undefined}
      />
    </div>
  );
});
