import type { BattleState } from "@/engine";
import { PileButton } from "@/ui/battle/PileButton";
import s from "./PileRail.module.css";

export type Pile = "draw" | "discard" | "exhaust";

interface Props {
  battle: BattleState;
  onOpenPile: (pile: Pile) => void;
}

export function PileRail({ battle, onOpenPile }: Props) {
  return (
    <aside className={s.rail} aria-label="牌堆" onClick={(event) => event.stopPropagation()}>
      <PileButton label="抽牌" count={battle.draw.length} icon="▤" onClick={() => onOpenPile("draw")} />
      <PileButton label="弃牌" count={battle.discard.length} icon="▥" onClick={() => onOpenPile("discard")} />
      <PileButton label="消耗" count={battle.exhaust.length} icon="⌁" onClick={() => onOpenPile("exhaust")} />
    </aside>
  );
}
