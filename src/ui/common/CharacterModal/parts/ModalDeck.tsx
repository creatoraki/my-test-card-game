// 档案右栏下半: 个人卡组的**只读**平铺。
//
// ⚠ 刻意不用 character/DeckCard —— 那是角色详情页的交互外壳(按钮语义、选中态、锻造入场动画)。
//   这里一张卡都不可点, 直接复用 HandCard 的固定卡面即可。

import type { Card } from "@/engine";
import { useState } from "react";
import { HandCard } from "@/ui/battle/HandCard";
import s from "../CharacterModal.module.css";

export function ModalDeck({ deck }: { deck: Card[] }) {
  const [hoveredCardUid, setHoveredCardUid] = useState<string | null>(null);
  const hoveredCard = deck.find((card) => card.uid === hoveredCardUid);

  return (
    <div className={s["cm-deck"]}>
      <div className={s["cm-block-head"]}>
        <span className={s["cm-block-title"]}>个人卡组</span>
        <span className={s["cm-block-note"]}>{deck.length} 张 · 只读</span>
      </div>
      <div className={s["cm-deck-grid"]}>
        {deck.map((card) => (
          <DeckTile
            key={card.uid}
            card={card}
            onMouseEnter={() => setHoveredCardUid(card.uid)}
            onMouseLeave={() =>
              setHoveredCardUid((current) => (current === card.uid ? null : current))
            }
          />
        ))}
        {deck.length === 0 && <p className={s["cm-empty-text"]}>该角色暂无卡牌</p>}
      </div>
      {hoveredCard && (
        <div className={s["cm-deck-hover-preview"]} aria-label={`${hoveredCard.name}卡牌放大预览`}>
          <span data-deck-card>
            <HandCard card={hoveredCard} variant="pile" playable selected={false} />
          </span>
        </div>
      )}
    </div>
  );
}

function DeckTile({
  card,
  onMouseEnter,
  onMouseLeave,
}: {
  card: Card;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div className={s["cm-deck-cell"]} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <span data-deck-card>
        <HandCard card={card} variant="pile" playable selected={false} />
      </span>
    </div>
  );
}
