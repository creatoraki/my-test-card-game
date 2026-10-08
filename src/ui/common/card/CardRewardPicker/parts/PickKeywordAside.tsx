// 悬停/选中候选的词条释义: 浮在面板内、贴在该卡侧边(左、中卡显示在右侧, 右卡显示在左侧), 允许盖住相邻卡。
// 卡面已放大到 350 宽, 这里只放词条释义, 不再重复放大卡面; 没有任何词条时整块不渲染。
import { memo, type CSSProperties } from "react";
import type { Card } from "@/engine";
import { CardKeywordNotes } from "@/ui/common/card/CardKeywordNotes";
import { useCardText } from "@/ui/common/shared/cardTextFormat";
import { CARD_TOP, CARD_W, GRID_LEFT, CARD_GAP } from "./pickGeometry";
import s from "./PickKeywordAside.module.css";

const ASIDE_W = 320;
const ASIDE_GAP = 16;
const POLLUTION_NOTE = [{ id: "pollution", name: "污染", desc: "抽到这张牌时污染值 +2" }];

interface Props {
  card: Card;
  index: number;
  /** 候选总数; 最后一列的释义翻到左侧。 */
  count: number;
}

export const PickKeywordAside = memo(function PickKeywordAside({ card, index, count }: Props) {
  const text = useCardText(card);
  const cardLeft = GRID_LEFT + index * (CARD_W + CARD_GAP);
  const toLeft = count > 1 && index === count - 1;
  const left = toLeft ? cardLeft - ASIDE_GAP - ASIDE_W : cardLeft + CARD_W + ASIDE_GAP;

  return (
    <div
      className={s.aside}
      data-side={toLeft ? "left" : "right"}
      style={{ left, top: CARD_TOP + 24, width: ASIDE_W } as CSSProperties}
      aria-live="polite"
    >
      <CardKeywordNotes
        text={text}
        card={card}
        className={s.notes}
        additionalNotes={card.contaminated ? POLLUTION_NOTE : undefined}
      />
    </div>
  );
});
