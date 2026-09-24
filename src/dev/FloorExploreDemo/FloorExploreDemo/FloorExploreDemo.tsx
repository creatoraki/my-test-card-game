import { useCallback, useRef, useState } from "react";
import { StageCanvas } from "@/ui/app/StageCanvas";
import EnergyReadout from "@/ui/explore/EnergyReadout";
import { ExploreDock } from "@/ui/explore/ExploreScreen/parts/ExploreDock";
import { ExploreInventory } from "@/ui/explore/ExploreScreen/parts/ExploreInventory";
import { useExploreInventory } from "@/ui/explore/ExploreScreen/useExploreInventory";
import { usePortalTravelTransition } from "@/ui/explore/ExploreScreen/usePortalTravelTransition";
import { START_ROOM_ID } from "../data";
import type { DoorFrame } from "../engine/doorGeometry";
import { PropLabel } from "../parts/PropLabel";
import { RoomTitle } from "../parts/RoomTitle";
import { ThreeStage } from "../parts/ThreeStage";
import type { FocusInfo } from "../three/core/focusTracker";
import { useDemoSession } from "./useDemoSession";
import s from "./FloorExploreDemo.module.css";

interface RoomEntry {
  roomId: string;
  entryDoorId: string | null;
}

/**
 * 《废弃楼层》3D 等轴探索演示: 3D 舞台铺底, 上面叠真实的探索 HUD(演示会话驱动)、
 * 物体标签、房间铭牌与过门黑幕。只负责编排, 场景与移动逻辑都在 three/ 与 engine/。
 */
export function FloorExploreDemo() {
  const session = useDemoSession();
  const inventory = useExploreInventory(session);
  const [entry, setEntry] = useState<RoomEntry>({ roomId: START_ROOM_ID, entryDoorId: null });
  const travel = usePortalTravelTransition(entry.roomId);
  const [focus, setFocus] = useState<FocusInfo | null>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const startTravel = travel.start;

  const onDoor = useCallback((frame: DoorFrame) => {
    startTravel(() => {
      setEntry({ roomId: frame.door.to.roomId, entryDoorId: frame.door.to.doorId });
      return true;
    });
  }, [startTravel]);

  const onLabelMove = useCallback((x: number, y: number) => {
    const el = labelRef.current;
    if (el) el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }, []);

  const blocked = travel.phase !== "idle" || inventory.blocked;

  return <StageCanvas className={s.screen} viewportClassName={s.viewport}>
    <ThreeStage
      roomId={entry.roomId}
      entryDoorId={entry.entryDoorId}
      blocked={blocked}
      onDoor={onDoor}
      onFocus={setFocus}
      onLabelMove={onLabelMove}
    />
    <PropLabel ref={labelRef} info={travel.phase === "idle" ? focus : null} />
    <RoomTitle roomId={entry.roomId} />
    {session && <>
      <div className={s.readout}><EnergyReadout energy={session.energy} /></div>
      <ExploreInventory session={session} inventory={inventory} />
      <ExploreDock session={session} inventory={inventory} locked={false} pending={false} />
    </>}
    {travel.phase !== "idle" && <div
      aria-hidden
      className={`${s.curtain} ${travel.phase === "fade-out" ? s.fadeOut : s.fadeIn}`}
      onAnimationEnd={travel.finishAnimation}
    />}
  </StageCanvas>;
}
