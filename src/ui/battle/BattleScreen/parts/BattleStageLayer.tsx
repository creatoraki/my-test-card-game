import { type CSSProperties, type MutableRefObject, type ReactNode, type RefObject } from "react";
import { validFoeTargetIds, type BattleState, type Enemy } from "@/engine";
import type { EnemyPlacement } from "@/data";
import { cx } from "@/ui/common/shared/cx";
import { CombatantView } from "@/ui/battle/CombatantView";
import { AmbienceLayer } from "@/ui/battle/AmbienceLayer";
import type { HitFx } from "@/ui/battle/choreo/animations";
import type { DeathPhase } from "@/ui/battle/choreo/deathChoreo";
import type { TelegraphKind } from "@/ui/battle/choreo/unitShell";
import { PlaneUnit } from "./PlaneUnit";
import { useSetMember } from "./useSetMember";
import s from "./BattleStageLayer.module.css";

interface Props {
  sceneTargetsRef: MutableRefObject<Set<HTMLElement>>;
  worldTargetsRef: MutableRefObject<Set<HTMLElement>>;
  planeRef: RefObject<HTMLDivElement>;
  planeUnitsRef: MutableRefObject<Set<HTMLElement>>;
  onPlaneLayout: () => void;
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

// 透视纵深组: 透视容器 → 相机层(scene) → 世界层(world)。背景组与近景组各一份, 由 rig 同步写入。
function DepthScene({
  front,
  sceneTargetsRef,
  worldTargetsRef,
  children,
}: {
  front?: boolean;
  sceneTargetsRef: MutableRefObject<Set<HTMLElement>>;
  worldTargetsRef: MutableRefObject<Set<HTMLElement>>;
  children: ReactNode;
}) {
  const sceneRef = useSetMember<HTMLDivElement>(sceneTargetsRef);
  const worldRef = useSetMember<HTMLDivElement>(worldTargetsRef);
  return (
    <div className={cx(s["battle-depth"], front && s["battle-depth-front"])}>
      <div className={s["battle-scene"]} ref={sceneRef}>
        <div className={s["battle-world"]} ref={worldRef}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function BattleStageLayer({
  sceneTargetsRef,
  worldTargetsRef,
  planeRef,
  planeUnitsRef,
  onPlaneLayout,
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
  const validTargetIds = new Set(validFoeTargetIds(battle, "player"));
  const depthProps = { sceneTargetsRef, worldTargetsRef };

  return (
    <div className={s["battle-layers"]} style={worldStyle}>
      <DepthScene {...depthProps}>
        {/* 背景图不参与景深模糊, 运镜时保持清晰。 */}
        <img className={s["battle-bg-video"]} src={bg} alt="" />
        <AmbienceLayer layer="far" mapId={mapId} paused={hitstop} fxRate={fxRate} dofTargetsRef={dofTargetsRef} />
      </DepthScene>

      {/* 敌人平面: 不在任何透视容器内, 各单位由 rig 写入等效 2D 变换, 推镜时按真实倍率重绘。 */}
      <div className={s["battle-plane"]} ref={planeRef}>
        <div className={s["battle-stage"]} ref={stageRef} onMouseLeave={() => onAimHover(null)}>
          <div className={s["enemy-row"]}>
            {enemies.map((enemy, index) => (
              <PlaneUnit
                key={enemy.id}
                unitsRef={planeUnitsRef}
                onLayout={onPlaneLayout}
                anchorDx={placements[index]?.dx}
                anchorDy={placements[index]?.dy}
              >
                <CombatantView
                  cmb={enemy}
                  currentTick={battle.tick}
                  targetable={isPlayerTurn && !!needsFoe && enemy.alive && validTargetIds.has(enemy.id)}
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
              </PlaneUnit>
            ))}
          </div>
        </div>
      </div>

      <DepthScene front {...depthProps}>
        <AmbienceLayer layer="near" mapId={mapId} paused={hitstop} fxRate={fxRate} dofTargetsRef={dofTargetsRef} />
      </DepthScene>
    </div>
  );
}
