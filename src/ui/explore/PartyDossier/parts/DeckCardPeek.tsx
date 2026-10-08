// 卡组页悬停卡牌时, 盖在左栏立绘舞台上的大卡详情(卡面放大 + 词条释义)。
// 纯展示、不吃指针; 铺满 PartyDossier 的左栏(810×904)并居中。
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
