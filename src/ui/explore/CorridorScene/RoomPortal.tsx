import type { CSSProperties } from "react";
import { CORRIDOR_PORTAL_ART, CORRIDOR_PORTAL_GROUND_TRIM } from "@/ui/art/corridorArt";
import s from "./CorridorScene.module.css";

/**
 * 房间传送门 —— 四个方向共用同一副外观。
 * 方向刻意不在场景里透露：玩家只能站上去，再从小地图读出它通往哪一间房。
 */
export function RoomPortal({ size, standing }: { size: number; standing: boolean }) {
  const trim = CORRIDOR_PORTAL_GROUND_TRIM;
  const cell = size / (1 - trim);
  return <span aria-hidden className={`${s.portalArt} ${standing ? s.portalLit : ""}`} style={{
    width: cell, height: cell, marginBottom: -cell * trim,
    backgroundImage: `url(${CORRIDOR_PORTAL_ART})`,
  } as CSSProperties} />;
}
