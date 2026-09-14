import { CORRIDOR_FAR_ART, CORRIDOR_NEAR_ONE_ART, CORRIDOR_NEAR_TWO_ART } from "@/ui/art/corridorArt";
import { CORRIDOR_LAYOUT } from "../corridorLayout";
import s from "./CorridorBackdrop.module.css";

const { farParallax, farTileWidth, farTileHeight, nearMapHeight, nearTop, nearSegmentYOffsets, abyssTop } = CORRIDOR_LAYOUT;

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

/** 近景：每个房间完整展示 1、2 两张图，左右拼成全宽地图并与实体 1:1 同步。 */
export function CorridorNear({ width }: { width: number }) {
  const segmentWidth = width / 2;

  return <div className={s.near} aria-hidden style={{
    width,
    top: nearTop,
    height: nearMapHeight,
  }}>
    <div className={s.nearSegment} style={{
      left: 0,
      top: nearSegmentYOffsets.one,
      width: segmentWidth,
      backgroundImage: `url(${CORRIDOR_NEAR_ONE_ART})`,
    }} />
    <div className={s.nearSegment} style={{
      left: segmentWidth,
      top: nearSegmentYOffsets.two,
      width: segmentWidth,
      backgroundImage: `url(${CORRIDOR_NEAR_TWO_ART})`,
    }} />
  </div>;
}
