import type { CSSProperties } from "react";
import type { CurioKind } from "@/explore/corridor/types";
import { CORRIDOR_PROP_ART, CORRIDOR_PROP_GROUND_TRIM } from "@/ui/art/corridorArt";
import s from "./CorridorScene.module.css";

/**
 * 四格横向精灵图：首格常态，交互时依次播放后三格。
 * size 是物件贴地后的可见高度；素材底部的透明留白用负外边距吃掉，
 * 这样容器底边就是物件的视觉底边，能直接对齐地面线。
 */
export function CorridorSprite({ kind, size, interacting }: { kind: CurioKind; size: number; interacting: boolean }) {
  const trim = CORRIDOR_PROP_GROUND_TRIM[kind];
  const cell = size / (1 - trim);
  return <span aria-hidden className={`${s.sprite} ${interacting ? s.interacting : ""}`} style={{
    width: cell * .75, height: cell, marginBottom: -cell * trim,
    backgroundImage: `url(${CORRIDOR_PROP_ART[kind]})`,
  } as CSSProperties} />;
}
