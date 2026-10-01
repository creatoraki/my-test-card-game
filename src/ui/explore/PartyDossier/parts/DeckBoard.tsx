// 「卡组」页: 个人卡组的只读平铺, 直接复用 HandCard 的固定卡面(按 0.8 缩放)。
import type { Card } from "@/engine";
import { HandCard } from "@/ui/common/card/HandCard";
import s from "./DeckBoard.module.css";

export function DeckBoard({ deck }: { deck: Card[] }) {
  if (deck.length === 0) return <p className={s.empty}>该队员暂无卡牌</p>;
  return (
    <div className={s.grid}>
      {deck.map((card) => (
        <div key={card.uid} className={s.cell}>
          <span className={s.card} data-deck-card>
            <HandCard card={card} variant="pile" playable selected={false} />
          </span>
        </div>
      ))}
    </div>
  );
}
