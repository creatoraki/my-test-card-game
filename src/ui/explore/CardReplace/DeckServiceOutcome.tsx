// 删牌 / 复制的结果展示: 卡面依次落位, 删除的卡盖「已删除」章, 复制出的新卡带光晕; 底部一句结论。
import type { CSSProperties } from "react";
import { cardDisplayName, type Card } from "@/engine";
import { HandCard } from "@/ui/common/card/HandCard";
import type { DeckServiceMode } from "./deckServiceModes";
import s from "./DeckServiceOutcome.module.css";

interface Props {
  mode: DeckServiceMode;
  before?: Card;
  after?: Card;
  ownerName: string;
}

export function DeckServiceOutcome({ mode, before, after, ownerName }: Props) {
  const cards = [
    before && { key: "before", card: before, label: mode === "remove" ? "已删除" : "原卡", removed: mode === "remove" },
    after && { key: "after", card: after, label: "新卡", removed: false },
  ].filter((entry): entry is { key: string; card: Card; label: string; removed: boolean } => Boolean(entry));

  return (
    <div className={s.stage}>
      <span className={s.floor} aria-hidden />
      <div className={s.cards}>
        {cards.map((entry, index) => (
          <div key={entry.key} className={s.slot} data-removed={entry.removed ? "" : undefined} data-fresh={entry.key === "after" ? "" : undefined}
            style={{ "--slot-delay": `${index * 220 + 120}ms` } as CSSProperties}>
            <div className={s.face} data-card-detail>
              <div className={s.scale}>
                <HandCard card={entry.card} variant="pile" playable selected={false} />
              </div>
              {entry.removed && <span className={s.stamp}>已删除</span>}
            </div>
            <span className={s.caption}>
              <b>{entry.label}</b>
              <span>{cardDisplayName(entry.card)}</span>
            </span>
          </div>
        ))}
      </div>
      <p className={s.summary}>
        {mode === "remove" && before && <>「<strong>{cardDisplayName(before)}</strong>」已从{ownerName}的卡组中删除</>}
        {mode !== "remove" && after && <>已获得「<strong>{cardDisplayName(after)}</strong>」，新卡已加入{ownerName}的卡组</>}
      </p>
    </div>
  );
}
