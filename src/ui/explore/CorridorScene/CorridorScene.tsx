import { CORRIDOR_CURIOS } from "@/data/corridorCurios";
import { CORRIDOR, type CorridorState } from "@/explore/corridor/types";
import { EXPLORE_RULES } from "@/explore/rules";
import { CORRIDOR_PORTAL_Y_OFFSET, CORRIDOR_PROP_Y_OFFSETS } from "@/ui/art/corridorArt";
import { CorridorAbyss, CorridorFar, CorridorNear } from "./CorridorBackdrop";
import { CorridorSprite } from "./CorridorSprite";
import { CorridorPlayer } from "./CorridorPlayer";
import { RoomPortal } from "./RoomPortal";
import { ShadowEncounter } from "./ShadowEncounter";
import { useCorridorMovement } from "./useCorridorMovement";
import { cameraX, CORRIDOR_LAYOUT } from "./corridorLayout";
import s from "./CorridorScene.module.css";

/** 一间房两屏宽：镜头跟随玩家居中卷动。 */
export function CorridorScene({ corridor, blocked, encountering, bossRoom, onPortalTravel }: {
  corridor: CorridorState;
  blocked: boolean;
  encountering: boolean;
  bossRoom: boolean;
  onPortalTravel: (travel: () => boolean) => void;
}) {
  const movement = useCorridorMovement(corridor, blocked, onPortalTravel);
  const camera = cameraX(movement.x, corridor.width);
  const entityFloorY = CORRIDOR.floorY + CORRIDOR_LAYOUT.entityGroundOffset;
  const activeThreat = corridor.threats.find((threat) => threat.id === corridor.encounterId);
  const playerWalking = movement.walking && !blocked;

  return <div className={s.scene} aria-label={bossRoom ? "总控室" : "房间场景"}>
    <CorridorFar camera={camera} />
    <CorridorAbyss />
    <div className={s.haze} aria-hidden />
    <div className={s.world} style={{ width: corridor.width, transform: `translateX(${-camera}px)` }}>
      <CorridorNear width={corridor.width} />
      {corridor.portals.map((portal) => {
        const standing = movement.standingPortal?.dir === portal.dir;
        return <div key={portal.dir} className={`${s.object} ${s.portal}`} style={{ left: portal.x, top: entityFloorY + CORRIDOR_PORTAL_Y_OFFSET }}>
          <button className={s.objectButton} type="button" disabled={blocked}
            onClick={() => movement.travel(portal.dir)}
            aria-label={standing ? "传送门，确认前往" : "传送门，走上去可点亮它通往的房间"}>
            <RoomPortal height={455} standing={standing} />
          </button>
          {standing && <span className={s.portalPrompt}>空格传送 · 粒子 −{EXPLORE_RULES.dungeon.energyPerRoomMove}</span>}
        </div>;
      })}
      {corridor.objects.map((object) => {
        const def = CORRIDOR_CURIOS[object.kind];
        const selected = movement.target?.id === object.id && !blocked;
        const near = movement.nearby.some((item) => item.id === object.id);
        const interacting = movement.interactingId === object.id;
        return <div key={object.id} className={`${s.object} ${object.used ? s.used : ""} ${selected ? s.selected : ""}`} style={{
          left: object.x,
          top: entityFloorY + CORRIDOR_PROP_Y_OFFSETS[object.kind],
        }}>
          <button className={s.objectButton} type="button" disabled={blocked || object.used || !near} onClick={() => movement.interact(object.id)} aria-label={`${def.name}${object.used ? "，已搜寻" : !near ? "，靠近后交互" : `，${def.verb}`}`}>
            <CorridorSprite kind={object.kind} size={def.size} interacting={interacting} />
          </button>
          {selected && <span className={s.targetMarker} aria-hidden>◆</span>}
        </div>;
      })}
      {corridor.threats.filter((threat) => !threat.defeated && threat.id !== corridor.encounterId).map((threat) => <div key={threat.id} className={s.dormant} style={{ left: threat.x, top: CORRIDOR.floorY }} aria-hidden><i /><span /></div>)}
      <div className={s.player} style={{ left: movement.x, top: entityFloorY }}>
        <CorridorPlayer walking={playerWalking} facing={movement.facing} />
      </div>
    </div>
    {encountering && activeThreat && <ShadowEncounter key={activeThreat.id} x={activeThreat.x - camera} final={activeThreat.final} />}
    <div className={s.vignette} aria-hidden />
  </div>;
}
