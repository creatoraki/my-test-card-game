import type { CSSProperties } from "react";
import type { Card } from "@/engine";
import type { ItemStack } from "@/items/types";
import { canEquipModule } from "@/data";
import { getModuleTheme } from "@/ui/art/moduleGlyphs/moduleGlyphs";
import { DeckCard } from "@/ui/common/card/DeckCard";
import { cx } from "@/ui/common/shared/cx";
import { CardModuleIcon } from "@/ui/town/assembly/AssemblyScene/icons";
import { TerminalPanel } from "../TerminalPanel";
import s from "./AssemblyDeckGrid.module.css";

interface Props {
  deck: Card[];
  selectedUid: string | null;
  moduleStacks: ItemStack[];
  onSelect: (uid: string) => void;
  className?: string;
}

/** 「02 卡组」面板: 当前角色的卡组网格, 选中一张作为装配目标。 */
export function AssemblyDeckGrid({ deck, selectedUid, moduleStacks, onSelect, className }: Props) {
  return (
    <TerminalPanel
      index="02"
      title="卡组"
      deco="DECK"
      extra={`${deck.length} 张`}
      ariaLabel="卡组浏览"
      className={className}
      bodyClassName={s.gridPanel}
    >
      {deck.length ? (
        <div className={s.track} role="list">
          {deck.map((card, index) => {
            const usable = Boolean(card.cardModule) || moduleStacks.some((stack) => canEquipModule(card, stack.itemId));
            return (
              <div
                key={card.uid}
                className={cx(s.card, !usable && s.dimmed)}
                role="listitem"
                data-installed={card.cardModule ? "true" : undefined}
                data-selected={card.uid === selectedUid ? "true" : undefined}
              >
                <DeckCard
                  card={card}
                  selected={card.uid === selectedUid}
                  index={index}
                  onClick={() => onSelect(card.uid)}
                  className={s.deckCard}
                />
                {card.cardModule && (
                  // 徽章染成该模组的主色 —— 卡面上不点开也能认出装的是哪一件。
                  <span
                    className={s.moduleMark}
                    role="img"
                    aria-label="已装配模组"
                    style={
                      {
                        "--asm-cyan": getModuleTheme(card.cardModule.itemId)?.hue,
                      } as CSSProperties
                    }
                  >
                    <CardModuleIcon />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className={s.empty}>当前角色没有卡牌</p>
      )}
    </TerminalPanel>
  );
}
