// 卡组面板 —— 读数条 + 锻造入口 + 卡面网格。
//
// ★ 成本口径统一读 RULES.deck 与 townStore 的 deckForgeCosts, 本面板不重算。
// ★ 三条锻造链路的演出全在 DeckForgeOverlay / DeckUpgradeOverlay 里, 由使用方挂在页面根层
//   (它们是全屏浮层, 挂在本面板内会被工作区的 overflow 裁掉)。

import type { CSSProperties } from "react";
import { RULES, type Card } from "@/engine";
import { DeckCard } from "@/ui/character/DeckCard";
import s from "./DeckPanel.module.css";

interface Props {
  deck: Card[];
  deckLevel: number;
  minDeckSize: number;
  selectedCardUid: string | null;
  onSelectCard: (uid: string) => void;
  onHoverCard: (uid: string | null) => void;
  onOpenForge: () => void;
}

export function DeckPanel({
  deck,
  deckLevel,
  minDeckSize,
  selectedCardUid,
  onSelectCard,
  onHoverCard,
  onOpenForge,
}: Props) {
  return (
    <div className={s.panel}>
      <div className={s.topline}>
        <div className={s.readout}>
          <span>{deck.length} 张</span>
          <span>
            Lv.{deckLevel}/{RULES.deck.levelMax}
          </span>
          <span>下限 {minDeckSize}</span>
        </div>
        <button className={s.forgeButton} type="button" onClick={onOpenForge}>
          <span aria-hidden="true">⚒</span>
          卡组锻造
        </button>
      </div>

      {/* data-deck-anchor: 抽卡演出把新卡飞向卡组时认这块位置(见 DeckForgeOverlay/ForgeDrawStage)。 */}
      <div className={s.grid} data-deck-anchor>
        {deck.map((card, i) => (
          <div key={card.uid} className={s.cell} style={{ "--i": i } as CSSProperties}>
            <DeckCard
              card={card}
              index={i}
              focusStyle="zoom"
              selected={card.uid === selectedCardUid}
              onClick={() => onSelectCard(card.uid)}
              onMouseEnter={() => onHoverCard(card.uid)}
              onMouseLeave={() => onHoverCard(null)}
              onFocus={() => onHoverCard(card.uid)}
              onBlur={() => onHoverCard(null)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
