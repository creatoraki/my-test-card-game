import { CORRIDOR_PORTAL_ART } from "@/ui/art/corridorArt";
import s from "./CorridorScene.module.css";

/**
 * 房间传送门 —— 四个方向共用同一副外观。
 * 方向刻意不在场景里透露：玩家只能站上去，再从小地图读出它通往哪一间房。
 */
export function RoomPortal({ height, standing }: { height: number; standing: boolean }) {
  return <img aria-hidden alt="" draggable={false} src={CORRIDOR_PORTAL_ART}
    className={`${s.portalArt} ${standing ? s.portalLit : ""}`}
    style={{ height }} />;
}
