import { forwardRef, memo } from "react";
import type { NearMapVariant } from "@/explore/dungeon/types";
import { getCorridorFarArt, CORRIDOR_NEAR_ART } from "@/ui/art/corridorArt";
import { CORRIDOR_LAYOUT } from "../corridorLayout";
import s from "./CorridorBackdrop.module.css";

const { farTileWidth, farTileHeight, nearMapHeight, nearTop, abyssTop } = CORRIDOR_LAYOUT;

/** 远景：整屏平铺，按相机位移的一个比例慢速滑动。 */
export const CorridorFar = forwardRef<HTMLDivElement, { mapId?: string }>(function CorridorFar({ mapId }, ref) {
  return <div className={s.far} aria-hidden>
    <div ref={ref} className={s.farStrip} style={{
      backgroundImage: `url(${getCorridorFarArt(mapId)})`,
      backgroundSize: `${farTileWidth}px ${farTileHeight}px`,
    }} />
  </div>;
});

/** 深渊：盖住平台下缘以下的远景，让近景读起来像架在半空的平台。 */
export const CorridorAbyss = memo(function CorridorAbyss() {
  return <div className={s.abyss} aria-hidden style={{ top: abyssTop }} />;
});

/** 近景：按 NEAR_MAP_ART_SCALE 倍尺寸绘制整张素材，并与对应宽度的房间实体同步。 */
export const CorridorNear = memo(function CorridorNear({ width, variant }: { width: number; variant: NearMapVariant }) {
  return <div className={s.near} aria-hidden style={{
    width,
    top: nearTop(variant),
    height: nearMapHeight(variant),
  }}>
    <div className={s.nearSegment} style={{
      inset: 0,
      backgroundImage: `url(${CORRIDOR_NEAR_ART[variant]})`,
      backgroundSize: "100% 100%",
    }} />
  </div>;
});
