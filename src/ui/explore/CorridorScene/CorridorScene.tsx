import { CORRIDOR_CURIOS } from "@/data/curios";
import { CORRIDOR, type CorridorState } from "@/explore/corridor/types";
import type { NearMapVariant } from "@/explore/dungeon/types";
import { roomMoveCostFor } from "@/explore/resources/energyCost";
import { useExploreStore } from "@/store/explore/exploreStore";
import {
  CORRIDOR_PROP_Y_OFFSETS,
  CORRIDOR_ROOM_PORTAL_DISPLAY_HEIGHT,
  CORRIDOR_ROOM_PORTAL_Y_OFFSET,
} from "@/ui/art/corridor/corridorArt";
import { CorridorAbyss, CorridorFar, CorridorNear } from "./parts/CorridorBackdrop";
import { EcoArkArchitecture } from "./parts/EcoArkArchitecture";
import { CorridorSprite } from "./parts/CorridorSprite/CorridorSprite";
import { CorridorPlayer } from "./parts/CorridorPlayer";
import { RoomPortal } from "./parts/RoomPortal/RoomPortal";
import { BossGate } from "./parts/BossGate/BossGate";
import { ShadowEncounter } from "./parts/ShadowEncounter/ShadowEncounter";
import { useCorridorMovement } from "./useCorridorMovement";
import { useExplorerChatter } from "./useExplorerChatter";
import { PlayerSpeech } from "./parts/PlayerSpeech";
import { cameraX, CORRIDOR_LAYOUT, CORRIDOR_SCENE_SCALE } from "./corridorLayout";
import { applyCorridorFrame } from "./corridorFrame";
import s from "./CorridorScene.module.css";
import { memo, useCallback, useLayoutEffect, useRef, type CSSProperties } from "react";

/** 一间房两屏宽：镜头跟随玩家居中卷动。memo: 行走中与场景无关的会话提交(暗雷检定、扣粒子)不重渲染整个场景。 */
export const CorridorScene = memo(function CorridorScene({ corridor, blocked, encountering, nearMapVariant, onPortalTravel }: {
  corridor: CorridorState;
  blocked: boolean;
  encountering: boolean;
  nearMapVariant: NearMapVariant;
  onPortalTravel: (travel: () => boolean) => void;
}) {
  const worldRef = useRef<HTMLDivElement>(null);
  const farStripRef = useRef<HTMLDivElement>(null);
  const playerAnchorRef = useRef<HTMLDivElement>(null);
  const onFrame = useCallback((x: number) => {
    applyCorridorFrame({
      world: worldRef.current,
      farStrip: farStripRef.current,
      player: playerAnchorRef.current,
    }, x, corridor.width);
  }, [corridor.width]);
  const movement = useCorridorMovement(corridor, blocked, onPortalTravel, onFrame);
  const rooms = useExploreStore((state) => state.session?.dungeon?.rooms);
  const mapId = useExploreStore((state) => state.session?.mapId);
  const explorerChatter = useExplorerChatter({
    walking: movement.walking,
    nearbyKey: movement.nearbyKey,
    portalDir: movement.portalDir,
    nearGate: movement.nearGate,
    blocked,
    activeObjectId: corridor.activeObjectId,
  });
  const camera = cameraX(movement.x, corridor.width);
  const entityFloorY = CORRIDOR.floorY + CORRIDOR_LAYOUT.entityGroundOffset;
  const activeThreat = corridor.threats.find((threat) => threat.id === corridor.encounterId);
  const playerWalking = movement.walking && !blocked;

  useLayoutEffect(() => {
    onFrame(movement.x);
  }, [movement.x, onFrame]);

  return <div
    className={s.scene}
    aria-label={corridor.bossGate ? "首领所在房间" : "房间场景"}
    style={{
      "--corridor-scale": CORRIDOR_SCENE_SCALE,
      "--corridor-floor-y": `${CORRIDOR.floorY}px`,
    } as CSSProperties}
  >
    <CorridorFar ref={farStripRef} mapId={mapId} />
    <CorridorAbyss />
    <div className={s.haze} aria-hidden />
    <div className={s.stage}>
      <div ref={worldRef} className={s.world} style={{ width: corridor.width }}>
        <CorridorNear width={corridor.width} variant={nearMapVariant} />
        {nearMapVariant === "ecoArk" && <EcoArkArchitecture
          roomId={corridor.roomId}
          width={corridor.width}
          occupiedX={[
            ...corridor.portals.map((portal) => portal.x),
            ...corridor.objects.map((object) => object.x),
            ...(corridor.bossGate ? [corridor.bossGate.x] : []),
          ]}
        />}
        {corridor.portals.map((portal) => {
          const standing = movement.standingPortal?.dir === portal.dir;
          return <div key={portal.dir} className={`${s.object} ${s.portal}`} style={{ left: portal.x, top: entityFloorY + CORRIDOR_ROOM_PORTAL_Y_OFFSET }}>
            <button className={s.objectButton} type="button" disabled={blocked}
              onClick={() => movement.travel(portal.dir)}
              aria-label={standing ? "传送门，确认前往" : "传送门，走上去可点亮它通往的房间"}>
              <RoomPortal height={CORRIDOR_ROOM_PORTAL_DISPLAY_HEIGHT} standing={standing} />
            </button>
            {standing && <span className={s.portalPrompt}>空格传送 · 粒子 −{roomMoveCostFor(Boolean(rooms?.[portal.to]?.visited))}</span>}
          </div>;
        })}
        {corridor.bossGate && <BossGate x={corridor.bossGate.x} top={entityFloorY} near={movement.nearGate} blocked={blocked} onClick={movement.openGate} />}
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
              <CorridorSprite kind={object.kind} interacting={interacting} outlined={near && !blocked} />
            </button>
            {selected && <span className={s.targetMarker} aria-hidden>◆</span>}
          </div>;
        })}
        <div ref={playerAnchorRef} className={s.playerAnchor} style={{ top: entityFloorY }}>
          <div className={s.player}>
            <CorridorPlayer walking={playerWalking} facing={movement.facing} />
          </div>
          <PlayerSpeech line={explorerChatter.line} />
        </div>
      </div>
    </div>
    {encountering && activeThreat && <ShadowEncounter key={activeThreat.id} x={(activeThreat.x - camera) * CORRIDOR_SCENE_SCALE} />}
    <div className={s.vignette} aria-hidden />
  </div>;
});
