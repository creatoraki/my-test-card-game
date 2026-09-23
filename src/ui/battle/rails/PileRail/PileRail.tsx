import type { BattleState } from "@/engine";
import { CardPile } from "@/ui/battle/CardPile";
import s from "./PileRail.module.css";

export type Pile = "draw" | "discard" | "exhaust";

interface Props {
  battle: BattleState;
  onOpenPile: (pile: Pile) => void;
}

export function PileRail({ battle, onOpenPile }: Props) {
  return (
    <aside className={s.rail} aria-label="牌堆" onClick={(event) => event.stopPropagation()}>
      <CardPile kind="draw" label="抽牌" count={battle.draw.length} onClick={() => onOpenPile("draw")} />
      <CardPile kind="discard" label="弃牌" count={battle.discard.length} onClick={() => onOpenPile("discard")} />
      <CardPile kind="exhaust" label="消耗" count={battle.exhaust.length} onClick={() => onOpenPile("exhaust")} />
    </aside>
  );
}
