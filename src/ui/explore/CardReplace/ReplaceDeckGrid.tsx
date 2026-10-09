// 卡组面板左侧的卡组网格: 整副卡组都列出来, 无法处理的卡压暗并注明原因, 让玩家知道不是漏了。
// 点击只「放入舱位」(可改选), 真正执行由底栏确认按钮完成。
// 选中表现与卡牌奖励三选一一致: 四角 L 型提示框点亮 + 轻微上浮, 其余卡退后一步。
import { memo, type CSSProperties } from "react";
import { cardDisplayName, type Card } from "@/engine";
import { playSfx } from "@/ui/audio";
import { HandCard } from "@/ui/common/card/HandCard";
import { InteractiveHint } from "@/ui/common/tooltip/InteractiveHint";
import s from "./ReplaceDeckGrid.module.css";

export interface ReplaceDeckEntry {
  card: Card;
  /** 无法处理的原因; null = 可选。 */
  lockedReason: string | null;
}

/** 卡位底部提示: 悬停未选 / 已选。 */
export interface DeckSlotLabels {
  idle: string;
  picked: string;
}

interface Props {
  entries: ReplaceDeckEntry[];
  selectedUid: string | null;
  labels: DeckSlotLabels;
  onSelect: (uid: string) => void;
}

export function ReplaceDeckGrid({ entries, selectedUid, labels, onSelect }: Props) {
  return (
    <div className={s.scroller}>
      <div className={s.grid} data-pick-grid>
        {entries.map((entry, index) => (
          <DeckSlot
            key={entry.card.uid}
            entry={entry}
            index={index}
            selected={entry.card.uid === selectedUid}
            dimmed={selectedUid !== null && entry.card.uid !== selectedUid}
            labels={labels}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

const DeckSlot = memo(function DeckSlot({ entry, index, selected, dimmed, labels, onSelect }: {
  entry: ReplaceDeckEntry;
  index: number;
  selected: boolean;
  dimmed: boolean;
  labels: DeckSlotLabels;
  onSelect: (uid: string) => void;
}) {
  const { card, lockedReason } = entry;
  const locked = Boolean(lockedReason);
  const select = () => {
    if (locked) {
      playSfx("disabled");
      return;
    }
    if (!selected) playSfx("cardSelect");
    onSelect(card.uid);
  };

  return (
    <div
      className={s.slot}
      data-selected={selected ? "" : undefined}
      data-dimmed={dimmed ? "" : undefined}
      data-locked={locked ? "" : undefined}
      data-sfx="off"
      style={{ "--slot-delay": `${Math.min(index, 11) * 40 + 80}ms` } as CSSProperties}
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={locked}
      aria-label={`${labels.idle}：${cardDisplayName(card)}`}
      onClick={select}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        select();
      }}
      onMouseEnter={() => !locked && playSfx("cardHover")}
    >
      <div className={s.cardBox} data-interactive-hint="">
        <div className={s.scale}>
          <HandCard card={card} variant="pile" playable selected={false} />
        </div>
        {!locked && <InteractiveHint active={selected} />}
      </div>
      <span className={s.state}>
        {locked ? lockedReason : selected ? labels.picked : labels.idle}
      </span>
    </div>
  );
});
