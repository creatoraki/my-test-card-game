import {
  CORRIDOR_ROOM_PORTAL_ANCHOR_SHIFT,
  CORRIDOR_ROOM_PORTAL_ART,
  CORRIDOR_ROOM_PORTAL_FRAME_SIZE,
} from "@/ui/art/corridor/corridorArt";
import s from "../../CorridorScene.module.css";
import type { CSSProperties } from "react";

/**
 * 房间传送门 —— 四个方向共用同一副外观。
 * 方向刻意不在场景里透露：玩家只能站上去，再从小地图读出它通往哪一间房。
 */
export function RoomPortal({ height, standing }: { height: number; standing: boolean }) {
  const portalStyle = {
    width: height,
    height,
    "--portal-anchor-shift": `${height * CORRIDOR_ROOM_PORTAL_ANCHOR_SHIFT / CORRIDOR_ROOM_PORTAL_FRAME_SIZE}px`,
  } as CSSProperties;
  return <div aria-hidden draggable={false}
    className={`${s.portalArt} ${standing ? s.portalLit : ""}`}
    style={portalStyle}>
    <span
      aria-hidden
      className={s.portalSprite}
      style={{ backgroundImage: `url("${CORRIDOR_ROOM_PORTAL_ART}")` }}
    />
  </div>;
}
