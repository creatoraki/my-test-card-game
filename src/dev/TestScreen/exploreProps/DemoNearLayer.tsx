import { memo } from "react";
import { CORRIDOR } from "@/explore/corridor/types";
import { nearMapArtScale } from "@/explore/dungeon/nearMapGeometry";
import type { DemoNearArt } from "./demoNearLayers";
import s from "./ExplorePropScene.module.css";

/** 基准图宽：基础倍率按 3072 宽的图换算，宽度不同的图层共用同一倍率，路面高度保持一致。 */
const REFERENCE_WIDTH = 3072;
/** 演示近景原图高度（左右无缝，可横向平铺）；所有可切换图层都按此高度出图。 */
const SOURCE_HEIGHT = 1024;
/** 基础倍率让 3072 宽图层的单块显示宽度与 neonCity1 近景一致，便于和正式场景对比。 */
export const DEMO_NEAR_BASE_SCALE = nearMapArtScale("neonCity1") * 2172 / REFERENCE_WIDTH;
/** 房间横向平铺的块数，用来检查左右接缝。 */
const TILE_COUNT = 2;
/** 原图中路面顶面（角色落脚线）与路面下缘的纵坐标。 */
const SOURCE_FLOOR_Y = 954;
const SOURCE_BOTTOM_Y = 974;

/** 背景调节项：scale 为叠加在基础倍率上的旋钮倍率；offsetY 只挪背景，不动角色与交互物。 */
export interface DemoBackdrop {
  scale: number;
  offsetY: number;
}

export const DEFAULT_BACKDROP: DemoBackdrop = { scale: 1, offsetY: 0 };

/** 背景最终几何：缩放后仍让路面顶面对齐地面线，再叠加上下偏移；单块宽度随当前图层原图宽度变化。 */
export function demoBackdropGeometry({ scale, offsetY }: DemoBackdrop, sourceWidth: number) {
  const finalScale = DEMO_NEAR_BASE_SCALE * scale;
  const top = CORRIDOR.floorY - Math.round(SOURCE_FLOOR_Y * finalScale) + offsetY;
  const tileWidth = Math.round(sourceWidth * finalScale);
  return {
    finalScale,
    tileWidth,
    width: tileWidth * TILE_COUNT,
    height: Math.round(SOURCE_HEIGHT * finalScale),
    top,
    abyssTop: top + Math.round(SOURCE_BOTTOM_Y * finalScale),
  };
}

/** 演示近景层：当前选中的建筑路面图按调节后的尺寸横向平铺，房间宽度随之变化。 */
export const DemoNearLayer = memo(function DemoNearLayer({ backdrop, art }: { backdrop: DemoBackdrop; art: DemoNearArt }) {
  const { width, height, top, tileWidth } = demoBackdropGeometry(backdrop, art.width);
  return <div className={s.demoNear} aria-hidden style={{
    width, height, top, backgroundImage: `url(${art.src})`, backgroundSize: `${tileWidth}px ${height}px`,
  }} />;
});

/** 演示深渊：从路面下缘开始盖住远景，让街区读起来像架在半空的平台；只用到纵向几何，与图宽无关。 */
export const DemoAbyss = memo(function DemoAbyss({ backdrop }: { backdrop: DemoBackdrop }) {
  return <div className={s.demoAbyss} aria-hidden style={{ top: demoBackdropGeometry(backdrop, REFERENCE_WIDTH).abyssTop }} />;
});
