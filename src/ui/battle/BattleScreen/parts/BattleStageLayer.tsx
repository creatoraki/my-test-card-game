import { useLayoutEffect, useRef, type CSSProperties, type MutableRefObject, type RefObject } from "react";
import type { BattleState, Enemy } from "@/engine";
import type { EnemyPlacement } from "@/data";
import { CombatantView } from "@/ui/battle/CombatantView";
import { AmbienceLayer } from "@/ui/battle/AmbienceLayer";
import type { HitFx } from "@/ui/battle/animations";
import type { DeathPhase } from "@/ui/battle/deathChoreo";
import type { TelegraphKind } from "@/ui/battle/unitShell";
import s from "./BattleStageLayer.module.css";

interface Props {
  sceneRef: RefObject<HTMLDivElement>;
  worldRef: RefObject<HTMLDivElement>;
  stageRef: RefObject<HTMLDivElement>;
  dofTargetsRef: MutableRefObject<Set<HTMLElement>>;
  worldStyle: CSSProperties;
  bg: string;
  mapId: string | null;
  hitstop: boolean;
  fxRate: number;
  enemies: Enemy[];
  placements: (EnemyPlacement | undefined)[];
  battle: BattleState;
  isPlayerTurn: boolean;
  needsFoe: boolean | undefined;
  hitPreview: Record<string, number | null> | null;
  damagePreview: Record<string, number | null> | null;
  attackerId: string | null;
  telegraph: { id: string; kind: TelegraphKind } | null;
  hits: Record<string, HitFx>;
  phaseOf: (id: string) => DeathPhase;
  twitchId: string | null;
  onCombatantClick: (id: string) => void;
  onAimHover: (id: string | null) => void;
}

export function BattleStageLayer({
  sceneRef,
  worldRef,
  stageRef,
  dofTargetsRef,
  worldStyle,
  bg,
  mapId,
  hitstop,
  fxRate,
  enemies,
  placements,
  battle,
  isPlayerTurn,
  needsFoe,
  hitPreview,
  damagePreview,
  attackerId,
  telegraph,
  hits,
  phaseOf,
  twitchId,
  onCombatantClick,
  onAimHover,
}: Props) {
  const bgImageRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const target = bgImageRef.current;
    if (!target) return;
    dofTargetsRef.current.add(target);
    return () => dofTargetsRef.current.delete(target);
  }, [bg, dofTargetsRef]);

  return (
    <div className={s["battle-scene"]} ref={sceneRef}>
      <div className={s["battle-world"]} ref={worldRef} style={worldStyle}>
        <img
          ref={bgImageRef}
          className={`${s["battle-bg-video"]} ${s["battle-bg-video-dof"]}`}
          src={bg}
          alt=""
        />
        <AmbienceLayer mapId={mapId} paused={hitstop} fxRate={fxRate} dofTargetsRef={dofTargetsRef} />
        <div className={s["battle-stage"]} ref={stageRef} onMouseLeave={() => onAimHover(null)}>
          <div className={s["enemy-row"]}>
            {enemies.map((enemy, index) => (
              <CombatantView
                key={enemy.id}
                cmb={enemy}
                currentTick={battle.tick}
                targetable={isPlayerTurn && !!needsFoe && enemy.alive}
                hitChance={hitPreview?.[enemy.id] ?? null}
                damagePreview={damagePreview?.[enemy.id] ?? null}
                attacking={enemy.id === attackerId}
                telegraph={telegraph?.id === enemy.id ? telegraph.kind : undefined}
                hit={hits[enemy.id] ?? null}
                deathPhase={phaseOf(enemy.id)}
                placement={placements[index]}
                twitching={enemy.id === twitchId}
                onClick={onCombatantClick}
                onHover={onAimHover}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
