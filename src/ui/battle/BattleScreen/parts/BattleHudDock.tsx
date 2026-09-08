import type { Dispatch, SetStateAction } from "react";
import type { BattleState, Card, Combatant } from "@/engine";
import { AllyBar } from "@/ui/battle/AllyBar";
import { HandTray } from "@/ui/battle/HandTray";
import { HandTools, type HandAction } from "@/ui/battle/HandTools";
import { ManaBar } from "@/ui/battle/ManaBar";
import { SquadBuffBar } from "@/ui/battle/SquadBuffBar";
import type { DeathPhase } from "@/ui/battle/deathChoreo";
import type { HitFx } from "@/ui/battle/animations";
import type { RenderHandEntry } from "../useHandRender";
import { cx } from "@/ui/common/cx";
import s from "./BattleHudDock.module.css";

interface Props {
  battle: BattleState;
  handAction: HandAction;
  setHandAction: Dispatch<SetStateAction<HandAction>>;
  setSelectedUid: Dispatch<SetStateAction<string | null>>;
  isPlayerTurn: boolean;
  animating: boolean;
  onWait: () => void;
  playerActing: boolean;
  allies: Combatant[];
  hits: Record<string, HitFx>;
  attackerId: string | null;
  selectedCard: Card | null;
  needsAlly: boolean | undefined;
  deathPhaseOf: (id: string) => DeathPhase;
  deathRate: number;
  deathVanishMs: number;
  renderHand: RenderHandEntry[];
  discardingUids: Set<string>;
  selectedUid: string | null;
  playingOutUid: string | null;
  onCardClick: (uid: string) => void;
  onCombatantClick: (id: string) => void;
  onCardAction: (uid: string) => void;
  onCardExited: (uid: string) => void;
}

export function BattleHudDock({
  battle,
  handAction,
  setHandAction,
  setSelectedUid,
  isPlayerTurn,
  animating,
  onWait,
  playerActing,
  allies,
  hits,
  attackerId,
  selectedCard,
  needsAlly,
  deathPhaseOf,
  deathRate,
  deathVanishMs,
  renderHand,
  discardingUids,
  selectedUid,
  playingOutUid,
  onCardClick,
  onCombatantClick,
  onCardAction,
  onCardExited,
}: Props) {
  return (
    <div className={s["battle-hud"]} onClick={(event) => event.stopPropagation()}>
      <div className={cx(s["party-dock"], playerActing && s["dock-hidden"])}>
        <HandTools
          battle={battle}
          handAction={handAction}
          isPlayerTurn={isPlayerTurn && !battle.pendingChoice}
          animating={animating}
          onWait={onWait}
          onToggle={(action) => {
            setSelectedUid(null);
            setHandAction((current) => (current === action ? null : action));
          }}
        />
        <SquadBuffBar battle={battle} />
        <ManaBar battle={battle} />
        <AllyBar
          allies={allies}
          hits={hits}
          attackerId={attackerId}
          focusFallbackCard={selectedCard}
          targetable={isPlayerTurn && !!needsAlly}
          onSelect={onCombatantClick}
          deathPhaseOf={deathPhaseOf}
          deathRate={deathRate}
          deathVanishMs={deathVanishMs}
        />
      </div>
      <HandTray
        renderHand={renderHand}
        battle={battle}
        discardingUids={discardingUids}
        isPlayerTurn={isPlayerTurn && !battle.pendingChoice}
        handAction={handAction}
        selectedUid={selectedUid}
        playingOutUid={playingOutUid}
        onCardClick={onCardClick}
        onCardAction={onCardAction}
        onCardExited={onCardExited}
      />
    </div>
  );
}
