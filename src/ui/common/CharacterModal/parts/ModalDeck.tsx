// 档案右栏下半: 个人卡组的**只读**平铺。
//
// ⚠ 刻意不用 character/DeckCard —— 那是角色详情页的交互外壳(按钮语义、选中态、锻造入场动画)。
//   这里一张卡都不可点, 直接用公共卡面 common/TechCard 即可。

import type { Card } from "@/engine";
import { cardArt } from "@/ui/art/cardArt";
import { CardTextRich } from "@/ui/common/CardTextRich";
import { useCardText } from "@/ui/common/cardText";
import { TechCard } from "@/ui/common/TechCard";
import s from "../CharacterModal.module.css";

export function ModalDeck({ deck }: { deck: Card[] }) {
  return (
    <div className={s["cm-deck"]}>
      <div className={s["cm-block-head"]}>
        <span className={s["cm-block-title"]}>个人卡组</span>
        <span className={s["cm-block-note"]}>{deck.length} 张 · 只读</span>
      </div>
      <div className={s["cm-deck-grid"]}>
        {deck.map((card) => (
          <DeckTile key={card.uid} card={card} />
        ))}
        {deck.length === 0 && <p className={s["cm-empty-text"]}>该角色暂无卡牌</p>}
      </div>
    </div>
  );
}

function DeckTile({ card }: { card: Card }) {
  const text = useCardText(card);
  return (
    <div className={s["cm-deck-cell"]}>
      <TechCard
        name={card.name}
        cost={card.cost}
        description={<CardTextRich text={text} />}
        artSrc={cardArt(card.id)}
        theme={card.cardType}
        className={s["cm-deck-card"]}
      />
    </div>
  );
}
