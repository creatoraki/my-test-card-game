import type { CSSProperties } from "react";
import type { CurioKind } from "@/explore/corridor/types";
import { CORRIDOR_PROP_ART, CORRIDOR_PROP_GROUND_TRIM } from "@/ui/art/corridorArt";
import s from "./CorridorScene.module.css";

/**
 * 物件素材默认使用四格横向精灵图，宝箱使用单张图片。
 * 精灵素材首格常态，交互时依次播放后三格。
 * size 是物件贴地后的可见高度；素材底部的透明留白用负外边距吃掉，
 * 这样容器底边就是物件的视觉底边，能直接对齐地面线。
 */
export function CorridorSprite({ kind, size, interacting }: { kind: CurioKind; size: number; interacting: boolean }) {
  const trim = CORRIDOR_PROP_GROUND_TRIM[kind];
  const cell = size / (1 - trim);
  const singleImage = kind === "chest";
  return <span aria-hidden className={`${s.sprite} ${singleImage ? s.singleSprite : ""} ${interacting ? s.interacting : ""}`} style={{
    width: cell * (singleImage ? 1.5 : .75), height: cell, marginBottom: -cell * trim,
    backgroundImage: `url(${CORRIDOR_PROP_ART[kind]})`,
  } as CSSProperties} />;
}
