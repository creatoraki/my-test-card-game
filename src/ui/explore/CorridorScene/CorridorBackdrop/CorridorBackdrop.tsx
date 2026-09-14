import type { NearMapVariant } from "@/explore/dungeon/types";
import { CORRIDOR_FAR_ART, CORRIDOR_NEAR_ART } from "@/ui/art/corridorArt";
import { CORRIDOR_LAYOUT } from "../corridorLayout";
import s from "./CorridorBackdrop.module.css";

const { farParallax, farTileWidth, farTileHeight, nearMapHeight, nearTop, abyssTop } = CORRIDOR_LAYOUT;

/** 远景：整屏平铺，按相机位移的一个比例慢速滑动。 */
export function CorridorFar({ camera }: { camera: number }) {
  return <div className={s.far} aria-hidden style={{
    backgroundImage: `url(${CORRIDOR_FAR_ART})`,
    backgroundSize: `${farTileWidth}px ${farTileHeight}px`,
    backgroundPositionX: -camera * farParallax,
  }} />;
}

/** 深渊：盖住平台下缘以下的远景，让近景读起来像架在半空的平台。 */
export function CorridorAbyss() {
  return <div className={s.abyss} aria-hidden style={{ top: abyssTop }} />;
}

/** 近景：按房间地图变体铺满整间房，并与实体 1:1 同步。 */
export function CorridorNear({ width, variant }: { width: number; variant: NearMapVariant }) {
  return <div className={s.near} aria-hidden style={{
    width,
    top: nearTop(variant),
    height: nearMapHeight,
  }}>
    <div className={s.nearSegment} style={{
      inset: 0,
      backgroundImage: `url(${CORRIDOR_NEAR_ART[variant]})`,
    }} />
  </div>;
}
