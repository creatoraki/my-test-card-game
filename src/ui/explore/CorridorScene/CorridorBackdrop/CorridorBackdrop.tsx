import { CORRIDOR_FAR_ART, CORRIDOR_NEAR_LEFT_ART, CORRIDOR_NEAR_RIGHT_ART } from "@/ui/art/corridorArt";
import { CORRIDOR_LAYOUT } from "../corridorLayout";
import s from "./CorridorBackdrop.module.css";

const { farParallax, farTileWidth, farTileHeight, nearHalfTileWidth, nearTileWidth, nearTileHeight, nearTop, abyssTop } = CORRIDOR_LAYOUT;

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

/** 近景：左右半图拼成一组并沿世界层重复，天然与实体 1:1 同步。 */
export function CorridorNear({ width }: { width: number }) {
  const tileCount = Math.ceil(width / nearTileWidth);

  return <div className={s.near} aria-hidden style={{
    width: tileCount * nearTileWidth,
    top: nearTop,
    height: nearTileHeight,
  }}>
    {Array.from({ length: tileCount }, (_, index) => <div key={index} className={s.nearTile} style={{ left: index * nearTileWidth, width: nearTileWidth }}>
      <div className={s.nearHalf} style={{ left: 0, width: nearHalfTileWidth, backgroundImage: `url(${CORRIDOR_NEAR_LEFT_ART})` }} />
      <div className={s.nearHalf} style={{ left: nearHalfTileWidth, width: nearHalfTileWidth, backgroundImage: `url(${CORRIDOR_NEAR_RIGHT_ART})` }} />
    </div>)}
  </div>;
}
