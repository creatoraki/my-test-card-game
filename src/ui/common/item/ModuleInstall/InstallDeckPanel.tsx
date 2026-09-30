// 装配弹窗「02 卡组」: 当前角色的卡牌网格, 装不了这件模组的牌压暗不可选;
// 已装模组的牌右上角挂模组徽章(按模组主色染色), 仍可选 —— 确认时顶替。
import type { CSSProperties } from "react";
import { getItemDef } from "@/data";
import type { Card } from "@/engine";
import { itemIcon } from "@/ui/art/items/itemArt";
import { getModuleTheme } from "@/ui/art/moduleGlyphs/moduleGlyphs";
import { DeckCard } from "@/ui/common/card/DeckCard";
import { TerminalPanel } from "@/ui/common/frame/TerminalPanel";
import { cx } from "@/ui/common/shared/cx";
import s from "./InstallDeckPanel.module.css";

interface Props {
  deck: readonly Card[];
  equippable: ReadonlySet<string>;
  selectedUid: string | null;
  onSelect: (uid: string) => void;
}

export function InstallDeckPanel({ deck, equippable, selectedUid, onSelect }: Props) {
  return (
    <TerminalPanel
      index="02"
      title="卡组"
      deco="DECK"
      extra={`可装 ${equippable.size} / ${deck.length} 张`}
      ariaLabel="选择装配卡牌"
      bodyClassName={s.body}
    >
      {deck.length ? (
        <div className={s.track} role="list">
          {deck.map((card, index) => {
            const usable = equippable.has(card.uid);
            return (
              <div
                key={card.uid}
                className={cx(s.card, !usable && s.dimmed)}
                role="listitem"
                data-selected={card.uid === selectedUid ? "true" : undefined}
              >
                <DeckCard
                  card={card}
                  selected={card.uid === selectedUid}
                  index={index}
                  onClick={() => usable && onSelect(card.uid)}
                  className={s.deckCard}
                />
                {card.cardModule && (
                  <span
                    className={s.moduleMark}
                    role="img"
                    aria-label={`已装配：${getItemDef(card.cardModule.itemId).name}`}
                    style={{ "--mark-hue": getModuleTheme(card.cardModule.itemId)?.hue } as CSSProperties}
                  >
                    {itemIcon(getItemDef(card.cardModule.itemId))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className={s.empty}>该角色没有卡牌</p>
      )}
    </TerminalPanel>
  );
}
