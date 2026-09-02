// 卡组面板 —— 读数条 + 锻造条(扩充 / 精简 / 升级) + 卡面网格。
//
// ★ 成本口径统一读 RULES.deck 与 townStore 的 deckForgeCosts, 本面板不重算。
// ★ 三条锻造链路的演出全在 DeckForgeOverlay / DeckUpgradeOverlay 里, 由使用方挂在页面根层
//   (它们是全屏浮层, 挂在本面板内会被工作区的 overflow 裁掉)。

import type { CSSProperties } from "react";
import { RULES, type Card } from "@/engine";
import type { DeckForgeCosts } from "@/ui/character/DeckForgeBar";
import { DeckCard } from "@/ui/character/DeckCard";
import { DeckForgeBar } from "@/ui/character/DeckForgeBar";
import s from "./DeckPanel.module.css";

interface Props {
  deck: Card[];
  deckLevel: number;
  minDeckSize: number;
  exp: number;
  costs: DeckForgeCosts;
  canRemove: boolean;
  drawDisabledReason?: string;
  selectedCardUid: string | null;
  onSelectCard: (uid: string) => void;
  onHoverCard: (uid: string | null) => void;
  onDraw: () => void;
  onRemove: () => void;
  onUpgrade: () => void;
}

export function DeckPanel({
  deck,
  deckLevel,
  minDeckSize,
  exp,
  costs,
  canRemove,
  drawDisabledReason,
  selectedCardUid,
  onSelectCard,
  onHoverCard,
  onDraw,
  onRemove,
  onUpgrade,
}: Props) {
  return (
    <div className={s.panel}>
      <div className={s.readout}>
        <span>{deck.length} 张</span>
        <span>
          Lv.{deckLevel}/{RULES.deck.levelMax}
        </span>
        <span>下限 {minDeckSize}</span>
      </div>

      <DeckForgeBar
        costs={costs}
        exp={exp}
        deckLevel={deckLevel}
        deckSize={deck.length}
        minDeckSize={minDeckSize}
        canDraw
        canRemove={canRemove}
        canOpenUpgrade={costs.upgrade != null}
        onDraw={onDraw}
        onRemove={onRemove}
        onUpgrade={onUpgrade}
        drawDisabledReason={drawDisabledReason}
      />

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
