import { CORRIDOR_CURIOS } from "@/data/corridorCurios";
import { CORRIDOR, type CorridorState } from "@/explore/corridor/types";
import { EXPLORE_RULES } from "@/explore/rules";
import { CorridorAbyss, CorridorFar, CorridorNear } from "./CorridorBackdrop";
import { CorridorSprite } from "./CorridorSprite";
import { CorridorPlayer } from "./CorridorPlayer";
import { RoomPortal } from "./RoomPortal";
import { ShadowEncounter } from "./ShadowEncounter";
import { useCorridorMovement } from "./useCorridorMovement";
import { CORRIDOR_LAYOUT } from "./corridorLayout";
import s from "./CorridorScene.module.css";

/** 一个房间正好一屏：镜头固定，不再跟随卷轴。 */
export function CorridorScene({ corridor, blocked, encountering, bossRoom }: {
  corridor: CorridorState;
  blocked: boolean;
  encountering: boolean;
  bossRoom: boolean;
}) {
  const movement = useCorridorMovement(corridor, blocked);
  const entityFloorY = CORRIDOR.floorY + CORRIDOR_LAYOUT.entityGroundOffset;
  const activeThreat = corridor.threats.find((threat) => threat.id === corridor.encounterId);

  return <div className={s.scene} aria-label={bossRoom ? "总控室" : "房间场景"}>
    <CorridorFar camera={0} />
    <CorridorAbyss />
    <div className={s.haze} aria-hidden />
    <div className={s.world} style={{ width: corridor.width }}>
      <CorridorNear width={corridor.width} />
      {corridor.portals.map((portal) => {
        const standing = movement.standingPortal?.dir === portal.dir;
        return <div key={portal.dir} className={`${s.object} ${s.portal}`} style={{ left: portal.x, top: entityFloorY }}>
          <button className={s.objectButton} type="button" disabled={blocked}
            onClick={() => movement.travel(portal.dir)}
            aria-label={standing ? "传送门，确认前往" : "传送门，走上去可点亮它通往的房间"}>
            <RoomPortal size={190} standing={standing} />
          </button>
          {standing && <span className={s.portalPrompt}>空格传送 · 粒子 −{EXPLORE_RULES.dungeon.energyPerRoomMove}</span>}
        </div>;
      })}
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
      <div className={s.player} style={{ left: movement.x, top: entityFloorY }}>
        <div className={s.actorDirection} style={{ transform: `scaleX(${movement.facing})` }}>
          <CorridorPlayer walking={movement.walking && !blocked} />
        </div>
      </div>
    </div>
    {encountering && activeThreat && <ShadowEncounter key={activeThreat.id} x={activeThreat.x} final={activeThreat.final} />}
    <div className={s.vignette} aria-hidden />
  </div>;
}
