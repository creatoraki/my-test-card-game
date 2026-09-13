import { CORRIDOR_CURIOS } from "@/data/corridorCurios";
import { CORRIDOR, type CorridorState } from "@/explore/corridor/types";
import { CorridorAbyss, CorridorFar, CorridorNear } from "./CorridorBackdrop";
import { CorridorSprite } from "./CorridorSprite";
import { CorridorPlayer } from "./CorridorPlayer";
import { ShadowEncounter } from "./ShadowEncounter";
import { useCorridorMovement } from "./useCorridorMovement";
import { CORRIDOR_LAYOUT } from "./corridorLayout";
import s from "./CorridorScene.module.css";

export function CorridorScene({ corridor, blocked, encountering, finalFloor }: { corridor: CorridorState; blocked: boolean; encountering: boolean; finalFloor: boolean }) {
  const movement = useCorridorMovement(corridor, blocked);
  const camera = Math.max(0, Math.min(corridor.width - CORRIDOR.viewportWidth, movement.x - 650));
  const entityFloorY = CORRIDOR.floorY + CORRIDOR_LAYOUT.entityGroundOffset;
  const activeThreat = corridor.threats.find((threat) => threat.id === corridor.encounterId);

  return <div className={s.scene} aria-label="横向探索场景">
    <CorridorFar camera={camera} />
    <CorridorAbyss />
    <div className={s.haze} aria-hidden />
    <div className={s.world} style={{ width: corridor.width, transform: `translateX(${-camera}px)` }}>
      <CorridorNear width={corridor.width} />
      {corridor.objects.map((object) => {
        const def = CORRIDOR_CURIOS[object.kind];
        const selected = movement.target?.id === object.id && !blocked;
        const near = movement.nearby.some((item) => item.id === object.id);
        const interacting = movement.interactingId === object.id;
        return <div key={object.id} className={`${s.object} ${object.used ? s.used : ""} ${selected ? s.selected : ""}`} style={{ left: object.x, top: entityFloorY }}>
          <button className={s.objectButton} type="button" disabled={blocked || object.used || !near} onClick={() => movement.interact(object.id)} aria-label={`${def.name}${object.used ? "，已搜寻" : !near ? "，靠近后交互" : `，${def.verb}`}`}>
            <CorridorSprite kind={object.kind} size={def.size * 2} interacting={interacting} />
          </button>
          {selected && <span className={s.targetMarker} aria-hidden>◆</span>}
        </div>;
      })}
      {corridor.threats.filter((threat) => !threat.defeated && threat.id !== corridor.encounterId).map((threat) => <div key={threat.id} className={s.dormant} style={{ left: threat.x, top: CORRIDOR.floorY }} aria-hidden><i /><span /></div>)}
      <div className={s.exit} style={{ left: corridor.width - 235, top: 390 }}><span>{finalFloor ? "总控室" : "下层通道"}</span><i /></div>
      <div className={s.player} style={{ left: movement.x, top: entityFloorY }}>
        <div className={s.actorDirection} style={{ transform: `scaleX(${movement.facing})` }}>
          <CorridorPlayer walking={movement.walking && !blocked} />
        </div>
      </div>
    </div>
    {encountering && activeThreat && <ShadowEncounter key={activeThreat.id} x={activeThreat.x - camera} final={activeThreat.final} />}
    <div className={s.vignette} aria-hidden />
  </div>;
}
