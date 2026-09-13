import { CORRIDOR_CURIOS } from "@/data/corridorCurios";
import { CORRIDOR, type CorridorState } from "@/explore/corridor/types";
import background from "@/assets/explore-corridor/corridor.png";
import { CorridorSprite } from "./CorridorSprite";
import { CorridorPlayer } from "./CorridorPlayer";
import { ShadowEncounter } from "./ShadowEncounter";
import { useCorridorMovement } from "./useCorridorMovement";
import s from "./CorridorScene.module.css";

export function CorridorScene({ corridor, blocked, encountering, finalFloor }: { corridor: CorridorState; blocked: boolean; encountering: boolean; finalFloor: boolean }) {
  const movement = useCorridorMovement(corridor, blocked);
  const camera = Math.max(0, Math.min(corridor.width - CORRIDOR.viewportWidth, movement.x - 650));
  const activeThreat = corridor.threats.find((threat) => threat.id === corridor.encounterId);
  const targetDef = movement.target ? CORRIDOR_CURIOS[movement.target.kind] : null;
  const explored = Math.max(corridor.exploredX, movement.x);

  return <div className={s.scene} aria-label="横向探索场景">
    <div className={s.backdrop} style={{ backgroundImage: `url(${background})`, backgroundPositionX: -camera * .72 }} />
    <div className={s.haze} aria-hidden />
    <div className={s.world} style={{ width: corridor.width, transform: `translateX(${-camera}px)` }}>
      <div className={s.ground} style={{ top: CORRIDOR.floorY }} aria-hidden />
      {Array.from({ length: 6 }, (_, index) => <div className={s.sectorMark} key={index} style={{ left: index * 1050 + 130, top: 304 }}>第 {corridor.round} 层 · {index + 1} 区</div>)}
      {corridor.objects.map((object) => {
        const def = CORRIDOR_CURIOS[object.kind];
        const selected = movement.target?.id === object.id && !blocked;
        const near = movement.nearby.some((item) => item.id === object.id);
        return <div key={object.id} className={`${s.object} ${object.used ? s.used : ""} ${selected ? s.selected : ""}`} style={{ left: object.x, top: CORRIDOR.floorY - (object.nodeIndex === 3 ? 26 : 0) }}>
          <span className={s.groundShadow} />
          <button className={s.objectButton} type="button" disabled={blocked || object.used || !near} onClick={() => movement.interact(object.id)} aria-label={`${def.name}${object.used ? "，已搜寻" : !near ? "，靠近后交互" : `，${def.verb}`}`}>
            <CorridorSprite index={def.sprite} size={def.size} />
          </button>
          <span className={s.objectLabel}>{object.used ? "已搜寻" : def.name}</span>
          {selected && <span className={s.targetMarker} aria-hidden>◆</span>}
        </div>;
      })}
      {corridor.threats.filter((threat) => !threat.defeated && threat.id !== corridor.encounterId).map((threat) => <div key={threat.id} className={s.dormant} style={{ left: threat.x, top: CORRIDOR.floorY }} aria-hidden><i /><span /></div>)}
      <div className={s.exit} style={{ left: corridor.width - 235, top: 392 }}><span>{finalFloor ? "总控室" : "下层通道"}</span><i /></div>
      <div className={s.player} style={{ left: movement.x, top: CORRIDOR.floorY }}>
        <span className={s.playerShadow} />
        <div className={s.actorDirection} style={{ transform: `scaleX(${movement.facing})` }}>
          <CorridorPlayer walking={movement.walking && !blocked} />
        </div>
        <span className={s.playerLabel}>炼金术士</span>
      </div>
    </div>
    {encountering && activeThreat && <ShadowEncounter key={activeThreat.id} x={activeThreat.x - camera} final={activeThreat.final} />}
    <div className={s.vignette} aria-hidden />
    <div className={s.navigation}>
      <div className={s.navigationTitle}><span>楼层行进图</span><span>已搜寻 {corridor.objects.filter((item) => item.used).length} / {corridor.objects.length}</span></div>
      <div className={s.track}>
        <span className={s.trackFill} style={{ width: `${explored / corridor.width * 100}%` }} />
        {corridor.objects.filter((item) => item.x <= explored + 800).map((item) => <span key={item.id} className={`${s.mapObject} ${item.used ? s.mapUsed : ""}`} style={{ left: `${item.x / corridor.width * 100}%` }} />)}
        {corridor.threats.filter((item) => item.x <= explored + 800).map((item) => <span key={item.id} className={`${s.mapThreat} ${item.defeated ? s.mapUsed : ""}`} style={{ left: `${item.x / corridor.width * 100}%` }}>{item.defeated ? "◇" : "◆"}</span>)}
        <span className={s.mapPlayer} style={{ left: `${movement.x / corridor.width * 100}%` }} />
      </div>
      <p>沿走廊深入 · 黑影出现后自动迎战</p>
    </div>
    {!blocked && targetDef && movement.target && <div className={s.interaction}>
      <button type="button" onClick={() => movement.interact()}><strong>{targetDef.verb} · {targetDef.name}</strong></button>
    </div>}
    <div className={s.controls}>
      <div className={s.moveButtons}>
        {[-1, 1].map((direction) => <button key={direction} type="button" disabled={blocked} aria-label={direction < 0 ? "向左行走" : "向右行走"}
          onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); movement.startPointer(direction); }}
          onPointerUp={movement.stop} onPointerCancel={movement.stop} onLostPointerCapture={movement.stop}>{direction < 0 ? "←" : "→"}</button>)}
      </div>
    </div>
  </div>;
}
