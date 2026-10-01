// 卡组页悬停卡牌时, 盖在左栏立绘舞台上的大卡详情(卡面放大 + 词条释义)。
// 纯展示、不吃指针; 位置由所在 DossierSection 的 body 决定(铺满并居中)。
import type { Card } from "@/engine";
import { DeckCardHoverPreview } from "@/ui/character/DeckCardHoverPreview";
import s from "./DeckCardPeek.module.css";

export function DeckCardPeek({ card }: { card: Card }) {
  return (
    <div className={s.peek}>
      <DeckCardHoverPreview key={card.uid} card={card} className={s.preview} />
    </div>
  );
}
