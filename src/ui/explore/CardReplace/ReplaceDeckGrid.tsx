// 卡组面板左侧的卡组柜: 整副卡组四列竖向滚动, 无法处理的卡压暗并在卡面上注明原因, 让玩家知道不是漏了。
// 点击只「放入舱位」(可改选), 真正执行由底栏确认按钮完成。
// 选中表现: 琥珀金选中框(DeckSelectFrame) + 轻微上浮, 其余卡退后一步; 演出收束后新卡位闪一次翠绿光。
// 三选一卡面皮肤(pick)下改用卡面自带的钢框 + 紫色霓虹选中框, 悬停 / 选中状态由本格记录后下发。
import { memo, useState, type CSSProperties } from "react";
import { cardDisplayName, type Card } from "@/engine";
import { playSfx } from "@/ui/audio";
import { DeckCardFace, useDeckCardSkin } from "./parts/DeckCardFace";
import { DeckSelectFrame } from "./parts/DeckSelectFrame";
import { DECK, GRID, rectStyle } from "./parts/deckGeometry";
import s from "./ReplaceDeckGrid.module.css";

export interface ReplaceDeckEntry {
  card: Card;
  /** 无法处理的原因; null = 可选。 */
  lockedReason: string | null;
}

interface Props {
  entries: ReplaceDeckEntry[];
  selectedUid: string | null;
  /** 演出收束后刚落位的新卡。 */
  freshUid: string | null;
  /** false = 演出中只读, 不响应点击与悬停。 */
  interactive: boolean;
  /** 卡位读屏提示, 如「放入置换舱」。 */
  actionLabel: string;
  onSelect: (uid: string) => void;
}

const GRID_VARS = {
  "--rc-scale": GRID.scale,
  "--rc-cols": GRID.columns,
  "--rc-col-gap": `${GRID.colGap}px`,
  "--rc-row-gap": `${GRID.rowGap}px`,
  "--rc-pad": `${GRID.pad}px`,
} as CSSProperties;

export function ReplaceDeckGrid({ entries, selectedUid, freshUid, interactive, actionLabel, onSelect }: Props) {
  return (
    <div className={s.scroller} style={{ ...rectStyle(DECK), ...GRID_VARS }} data-interactive={interactive ? "" : undefined}>
      <div className={s.grid} data-pick-grid>
        {entries.map((entry, index) => (
          <DeckSlot
            key={entry.card.uid}
            entry={entry}
            index={index}
            selected={entry.card.uid === selectedUid}
            dimmed={selectedUid !== null && entry.card.uid !== selectedUid}
            fresh={entry.card.uid === freshUid}
            interactive={interactive}
            actionLabel={actionLabel}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

const DeckSlot = memo(function DeckSlot({ entry, index, selected, dimmed, fresh, interactive, actionLabel, onSelect }: {
  entry: ReplaceDeckEntry;
  index: number;
  selected: boolean;
  dimmed: boolean;
  fresh: boolean;
  interactive: boolean;
  actionLabel: string;
  onSelect: (uid: string) => void;
}) {
  const { card, lockedReason } = entry;
  const locked = Boolean(lockedReason);
  const pickSkin = useDeckCardSkin() === "pick";
  const [hovered, setHovered] = useState(false);
  const live = interactive && !locked;
  const pickState = locked ? null : selected ? "selected" : live && hovered ? "hover" : null;
  const select = () => {
    if (!interactive) return;
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
      data-fresh={fresh ? "" : undefined}
      data-sfx="off"
      style={{ "--slot-delay": `${Math.min(index, 11) * 40 + 160}ms` } as CSSProperties}
      role="button"
      tabIndex={locked || !interactive ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={locked || !interactive}
      aria-label={`${actionLabel}：${cardDisplayName(card)}`}
      onClick={select}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        select();
      }}
      onMouseEnter={() => {
        setHovered(true);
        if (live) playSfx("cardHover");
      }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className={s.scale}>
        <div className={s.face}>
          <DeckCardFace card={card} state={pickState} selectFrame={!locked} />
        </div>
        {!locked && !pickSkin && <DeckSelectFrame selected={selected} />}
        {locked && <span className={s.reason}>{lockedReason}</span>}
      </div>
    </div>
  );
});
